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
  let scheduledMysql;
  if (orderType === "walk-in" || !scheduledTime) {
    // Use current time for POS or when no time provided
    scheduledMysql = new Date().toISOString().slice(0, 19).replace("T", " ");
  } else {
    // scheduledTime is "HH:MM" — combine with today's date
    const today = new Date().toISOString().split("T")[0];
    const dt = new Date(`${today}T${scheduledTime}:00`);
    const h = dt.getHours();
    if (h < 10 || h >= 22) {
      throw new Error("Scheduled time must be between 10:00 AM and 10:00 PM.");
    }
    scheduledMysql = `${today} ${scheduledTime}:00`;
  }

  // Incremental order number per truck per day (resets daily)
  const [[{ nextNum }]] = await db.query(
    `SELECT COALESCE(MAX(
       CASE WHEN order_number REGEXP '^[0-9]+$'
         THEN CAST(order_number AS UNSIGNED) ELSE 0 END
     ), 0) + 1 AS nextNum
     FROM checkout
     WHERE license_plate = ? AND DATE(scheduled_time) = CURDATE()`,
    [licensePlate],
  );
  const orderNumber = String(nextNum);

  const total = items
    .reduce((sum, i) => sum + parseFloat(i.price) * parseInt(i.quantity), 0)
    .toFixed(2);

  const [result] = await db.query(
    `INSERT INTO checkout
       (order_number, license_plate, customer_email, order_type, order_status,
        scheduled_time, total_price, payment_method, payment_status)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 'pending')`,
    [
      orderNumber,
      licensePlate,
      customerEmail || null,
      orderType,
      scheduledMysql,
      total,
      paymentMethod,
    ],
  );
  const orderId = result.insertId;

  for (const item of items) {
    const lineTotal = (
      parseFloat(item.price) * parseInt(item.quantity)
    ).toFixed(2);
    await db.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total_price)
       VALUES (?, ?, ?, ?)`,
      [orderId, item.menuItemId, item.quantity, lineTotal],
    );
  }

  return { orderId, orderNumber };
}
