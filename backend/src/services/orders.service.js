import * as OrdersModel from "../models/orders.model.js";
import { verifyToken } from "../auth/jwt.js";

export async function getOrderById(db, url) {
  const orderId = url.replace("/api/orders/", "");
  const order = await OrdersModel.findById(db, orderId);
  if (!order) {
    return { error: "Order not found" };
  }
  return order;
}

export async function listOrders(db, req, url) {
  const { searchParams } = new URL(url, "http://localhost");
  const status     = searchParams.get("status");
  const search     = searchParams.get("search");
  const truckParam = searchParams.get("truck");
  const date       = searchParams.get("date"); // YYYY-MM-DD
  const page       = parseInt(searchParams.get("page") ?? "0", 10); // 0 = no pagination
  const PAGE_SIZE  = 20;

  // Extract JWT payload for role + license_plate
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);
  const role = payload?.role ?? null;
  const jwtLicensePlate = payload?.license_plate ?? null;

  // Only admin can switch trucks via ?truck= param
  const effectiveTruck = (role === "admin" && truckParam) ? truckParam : jwtLicensePlate;

  // Promote eligible pending orders → preparing
  if (effectiveTruck && status?.includes("pending")) {
    await db.query(
      `UPDATE checkout
       SET order_status = 'preparing'
       WHERE order_status = 'pending'
         AND license_plate = ?
         AND (scheduled_time IS NULL OR scheduled_time <= DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [effectiveTruck],
    );
  }

  // Build WHERE clause separately so it can be reused for COUNT
  let where = ` WHERE 1=1`;
  const params = [];

  if (effectiveTruck) {
    where += ` AND c.license_plate = ?`;
    params.push(effectiveTruck);
  }

  if (status) {
    const list = status.split(",").map((s) => s.trim());
    where += ` AND c.order_status IN (${list.map(() => "?").join(",")})`;
    params.push(...list);
  }

  if (search) {
    where += ` AND (c.order_number LIKE ? OR CAST(c.checkout_id AS CHAR) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (date) {
    where += ` AND DATE(c.date_created) = ?`;
    params.push(date);
  }

  // For paginated (past) queries sort by date desc; for live queues sort by status priority
  const orderBy = page > 0
    ? ` ORDER BY c.date_created DESC`
    : ` ORDER BY FIELD(c.order_status, 'ready', 'preparing', 'pending', 'completed', 'cancelled'),
                c.checkout_id ASC`;

  // Paginated query (past orders)
  if (page > 0) {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(DISTINCT c.checkout_id) AS total FROM checkout c${where}`,
      params,
    );
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const offset = (page - 1) * PAGE_SIZE;

    const dataQuery = `SELECT c.checkout_id, c.order_number, c.order_type, c.order_status,
                              c.total_price, c.payment_method, c.customer_email,
                              c.scheduled_time, c.license_plate, c.date_created,
                              u.phone_number AS customer_phone,
                              GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) ORDER BY mi.item_name SEPARATOR ', ') AS items
                       FROM checkout c
                       LEFT JOIN order_items oi ON oi.order_id = c.checkout_id
                       LEFT JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
                       LEFT JOIN users u ON u.email = c.customer_email
                       ${where}
                       GROUP BY c.checkout_id
                       ${orderBy}
                       LIMIT ? OFFSET ?`;
    const [rows] = await db.query(dataQuery, [...params, PAGE_SIZE, offset]);
    return { orders: rows, total, page, pages: totalPages };
  }

  // Non-paginated query (current / scheduled orders)
  const dataQuery = `SELECT c.checkout_id, c.order_number, c.order_type, c.order_status,
                            c.total_price, c.payment_method, c.customer_email,
                            c.scheduled_time, c.license_plate, c.date_created,
                            u.phone_number AS customer_phone,
                            GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) ORDER BY mi.item_name SEPARATOR ', ') AS items
                     FROM checkout c
                     LEFT JOIN order_items oi ON oi.order_id = c.checkout_id
                     LEFT JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
                     LEFT JOIN users u ON u.email = c.customer_email
                     ${where}
                     GROUP BY c.checkout_id
                     ${orderBy}`;
  const [rows] = await db.query(dataQuery, params);
  return rows;
}

export async function updateOrderStatus(db, orderId, newStatus) {
  const allowed = ["ready", "completed", "cancelled"];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  await db.query(
    `UPDATE checkout SET order_status = ? WHERE checkout_id = ?`,
    [newStatus, orderId],
  );
  return { success: true };
}
