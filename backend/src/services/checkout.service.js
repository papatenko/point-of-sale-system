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
  let scheduledMysql = null;
  if (scheduledTime) {
    const now = new Date();
    const currentHour = now.getHours();
    const outsideHours = currentHour < 10 || currentHour >= 22;

    // Use tomorrow's date if ordering after closing or before opening
    const targetDate = new Date(now);
    if (outsideHours) targetDate.setDate(targetDate.getDate() + 1);
    const dateStr = targetDate.toISOString().split("T")[0];

    const dt = new Date(`${dateStr}T${scheduledTime}:00`);
    const h = dt.getHours();
    if (h < 10 || h >= 22) {
      throw new Error("Scheduled time must be between 10:00 AM and 10:00 PM.");
    }
    scheduledMysql = `${dateStr} ${scheduledTime}:00`;
  }
  // Walk-in and unscheduled online orders both use NULL scheduled_time

  // Incremental order number per truck per day (resets daily)
  const [[{ nextNum }]] = await db.query(
    `SELECT COALESCE(MAX(
       CASE WHEN order_number REGEXP '^[0-9]+$'
         THEN CAST(order_number AS UNSIGNED) ELSE 0 END
     ), 0) + 1 AS nextNum
     FROM checkout
     WHERE license_plate = ? AND DATE(COALESCE(scheduled_time, NOW())) = CURDATE()`,
    [licensePlate],
  );
  const orderNumber = String(nextNum);

  // Insert checkout with a placeholder total (will update after order_items trigger runs)
  const [result] = await db.query(
    `INSERT INTO checkout
       (order_number, license_plate, customer_email, order_type, order_status,
        scheduled_time, total_price, payment_method, payment_status)
     VALUES (?, ?, ?, ?, 'pending', ?, 0, ?, 'pending')`,
    [
      orderNumber,
      licensePlate,
      customerEmail || null,
      orderType,
      scheduledMysql,
      paymentMethod,
    ],
  );
  const orderId = result.insertId;

  for (const item of items) {
    // Insert with any value, trigger will set correct line_total_price
    await db.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total_price)
       VALUES (?, ?, ?, 0)`,
      [orderId, item.menuItemId, item.quantity],
    );
  }

  // Now sum the (possibly discounted) order_items and update checkout
  const [[{ total }]] = await db.query(
    `SELECT SUM(line_total_price) AS total FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  await db.query(
    `UPDATE checkout SET total_price = ? WHERE checkout_id = ?`,
    [total, orderId]
  );

  return { orderId, orderNumber };
}
