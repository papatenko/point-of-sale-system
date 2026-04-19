import { verifyToken } from "../auth/jwt.js";

function getLicensePlateFromReq(req) {
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  const payload = verifyToken(token);
  return payload?.license_plate ?? null;
}

function getEmailFromReq(req) {
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  return verifyToken(token)?.email ?? null;
}

export async function createCheckout(db, body, req = null) {
  const {
    orderType = "online-pickup",
    customerEmail,
    paymentMethod,
    licensePlate: bodyLicensePlate,
    scheduledTime,
    scheduledDate,
    items,
  } = body;

  if (!items || items.length === 0) {
    throw new Error("Cart is empty.");
  }

  // For POS/walk-in orders, get license plate and cashier email from JWT
  let licensePlate = bodyLicensePlate;
  let cashierEmail = null;
  if (orderType === "walk-in") {
    licensePlate = getLicensePlateFromReq(req);
    if (!licensePlate) {
      throw new Error("Could not determine truck from employee token.");
    }
    cashierEmail = getEmailFromReq(req);
  }

  if (!licensePlate) {
    throw new Error("Please select a pickup location.");
  }

  // Determine scheduled datetime
  let scheduledMysql = null;
  if (scheduledTime && scheduledDate) {
    const dt = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const h = dt.getHours();
    const m = dt.getMinutes();

    // Fetch truck operating hours and validate against them
    const [[truck]] = await db.query(
      `SELECT operating_hours_start, operating_hours_end FROM food_trucks WHERE license_plate = ?`,
      [licensePlate],
    );
    const parseT = (str) => {
      if (!str) return null;
      const parts = String(str).split(":").map(Number);
      return { h: parts[0], m: parts[1] ?? 0 };
    };
    const open  = parseT(truck?.operating_hours_start) ?? { h: 10, m: 0 };
    const close = parseT(truck?.operating_hours_end)   ?? { h: 22, m: 0 };

    const orderMins  = h * 60 + m;
    const openMins   = open.h  * 60 + open.m;
    const closeMins  = close.h * 60 + close.m;

    const fmt = ({ h, m }) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return m === 0 ? `${dh} ${ampm}` : `${dh}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    if (orderMins < openMins || orderMins > closeMins) {
      throw new Error(
        `Scheduled time must be between ${fmt(open)} and ${fmt(close)}.`,
      );
    }

    scheduledMysql = `${scheduledDate} ${scheduledTime}:00`;
  }

  // Determine order date for numbering: use scheduled date if provided, else today (local)
  const orderDate = scheduledMysql
    ? scheduledMysql.split(" ")[0]
    : (() => {
        const now = new Date();
        const y = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${mo}-${d}`;
      })();

  // Incremental order number per truck per day, keyed to the order's target date
  const [[{ nextNum }]] = await db.query(
    `SELECT COALESCE(MAX(
       CASE WHEN order_number REGEXP '^[0-9]+$'
         THEN CAST(order_number AS UNSIGNED) ELSE 0 END
     ), 0) + 1 AS nextNum
     FROM checkout
     WHERE license_plate = ?
       AND DATE(COALESCE(scheduled_time, date_created)) = ?`,
    [licensePlate, orderDate],
  );
  const orderNumber = String(nextNum);

  // ASAP online orders and walk-in orders should end up as preparing;
  // scheduled orders stay pending until auto-promoted.
  const initialStatus =
    orderType === "online-pickup" && !scheduledMysql ? "preparing" :
    orderType === "walk-in" ? "preparing" : "pending";

  // Always INSERT as 'pending' so order_items can be inserted first.
  // Then UPDATE to 'preparing' if needed — this lets the BEFORE UPDATE trigger
  // fire with order_items already present (for inventory deduction).
  const [result] = await db.query(
    `INSERT INTO checkout
       (order_number, license_plate, customer_email, cashier_email, order_type, order_status,
        scheduled_time, date_created, total_price, payment_method, payment_status)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW(), 0, ?, 'pending')`,
    [
      orderNumber,
      licensePlate,
      customerEmail || null,
      cashierEmail,
      orderType,
      scheduledMysql,
      paymentMethod,
    ],
  );
  const orderId = result.insertId;

  for (const item of items) {
    await db.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total_price)
       VALUES (?, ?, ?, 0)`,
      [orderId, item.menuItemId, item.quantity],
    );
  }

  // Sum order_items and update checkout total
  const [[{ total }]] = await db.query(
    `SELECT SUM(line_total_price) AS total FROM order_items WHERE order_id = ?`,
    [orderId],
  );
  await db.query(
    `UPDATE checkout SET total_price = ? WHERE checkout_id = ?`,
    [total, orderId],
  );

  // Now promote to preparing if needed — trigger fires here with order_items present
  if (initialStatus === "preparing") {
    try {
      await db.query(
        `UPDATE checkout SET order_status = 'preparing' WHERE checkout_id = ?`,
        [orderId],
      );
    } catch (err) {
      // Trigger blocked promotion (e.g. insufficient inventory) — order stays pending
      console.error("Could not promote order to preparing:", err.message);
    }
  }

  return { orderId, orderNumber };
}
