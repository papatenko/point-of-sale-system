import { verifyToken } from "../auth/jwt.js";

function getLicensePlateFromReq(req) {
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  const payload = verifyToken(token);
  return payload?.license_plate ?? null;
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

  // For POS/walk-in orders, get license plate from JWT
  let licensePlate = bodyLicensePlate;
  if (orderType === "walk-in") {
    licensePlate = getLicensePlateFromReq(req);
    if (!licensePlate) {
      throw new Error("Could not determine truck from employee token.");
    }
  }

  if (!licensePlate) {
    throw new Error("Please select a pickup location.");
  }

  // Determine scheduled datetime
  let scheduledMysql = null;
  if (scheduledTime && scheduledDate) {
    const dt = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const h = dt.getHours();
    if (h < 10 || h >= 22) {
      throw new Error("Scheduled time must be between 10:00 AM and 10:00 PM.");
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

  // ASAP online orders go straight to preparing; scheduled orders start as pending
  const initialStatus =
    orderType === "online-pickup" && !scheduledMysql ? "preparing" : "pending";

  const [result] = await db.query(
    `INSERT INTO checkout
       (order_number, license_plate, customer_email, order_type, order_status,
        scheduled_time, total_price, payment_method, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'pending')`,
    [
      orderNumber,
      licensePlate,
      customerEmail || null,
      orderType,
      initialStatus,
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

  return { orderId, orderNumber };
}
