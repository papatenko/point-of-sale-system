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
  const dateFrom   = searchParams.get("dateFrom"); // YYYY-MM-DD
  const dateTo     = searchParams.get("dateTo");   // YYYY-MM-DD
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
  const isCustomer = payload?.user_type === "customer";

  // Promote eligible pending orders → preparing
  if (!isCustomer && effectiveTruck && status?.includes("pending")) {
    try {
      // Set session var so the deduct_inventory_on_preparing trigger can populate adjusted_by
      const employeeEmail = payload?.email ?? null;
      await db.query(`SET @current_employee_email = ?`, [employeeEmail]);
      await db.query(
        `UPDATE checkout
         SET order_status = 'preparing'
         WHERE order_status = 'pending'
           AND license_plate = ?
           AND (scheduled_time IS NULL OR scheduled_time <= DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [effectiveTruck],
      );
    } catch (promoteErr) {
      // If the trigger or update fails, log and continue — don't block the fetch
      console.error("Order promotion failed:", promoteErr.message);
    }
  }

  // Build WHERE clause separately so it can be reused for COUNT
  let where = ` WHERE 1=1`;
  const params = [];

  if (isCustomer) {
    // Customer sees only their own orders (filtered by email in JWT)
    where += ` AND c.customer_email = ?`;
    params.push(payload.email);
  } else if (effectiveTruck) {
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

  if (dateFrom) {
    where += ` AND DATE(c.date_created) >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    where += ` AND DATE(c.date_created) <= ?`;
    params.push(dateTo);
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
                              ft.current_location AS truck_location,
                              GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) ORDER BY mi.item_name SEPARATOR ' | ') AS items,
                              (SELECT COUNT(*) > 0
                               FROM order_items oi2
                               JOIN recipe_ingredient ri ON ri.menu_item_id = oi2.menu_item_id
                               LEFT JOIN truck_inventory ti
                                      ON ti.ingredient_id = ri.ingredient_id
                                     AND ti.license_plate = c.license_plate
                               WHERE oi2.order_id = c.checkout_id
                                 AND (ti.quantity_on_hand IS NULL
                                      OR ti.quantity_on_hand < ri.quantity_needed * oi2.quantity)
                              ) AS inventory_warning
                       FROM checkout c
                       LEFT JOIN order_items oi ON oi.order_id = c.checkout_id
                       LEFT JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
                       LEFT JOIN users u ON u.email = c.customer_email
                       LEFT JOIN food_trucks ft ON ft.license_plate = c.license_plate
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
                            ft.current_location AS truck_location,
                            GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) ORDER BY mi.item_name SEPARATOR ' | ') AS items,
                            (SELECT COUNT(*) > 0
                             FROM order_items oi2
                             JOIN recipe_ingredient ri ON ri.menu_item_id = oi2.menu_item_id
                             LEFT JOIN truck_inventory ti
                                    ON ti.ingredient_id = ri.ingredient_id
                                   AND ti.license_plate = c.license_plate
                             WHERE oi2.order_id = c.checkout_id
                               AND (ti.quantity_on_hand IS NULL
                                    OR ti.quantity_on_hand < ri.quantity_needed * oi2.quantity)
                            ) AS inventory_warning
                     FROM checkout c
                     LEFT JOIN order_items oi ON oi.order_id = c.checkout_id
                     LEFT JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
                     LEFT JOIN users u ON u.email = c.customer_email
                     LEFT JOIN food_trucks ft ON ft.license_plate = c.license_plate
                     ${where}
                     GROUP BY c.checkout_id
                     ${orderBy}`;
  const [rows] = await db.query(dataQuery, params);
  return rows;
}

export async function updateOrderItems(db, orderId, items) {
  if (!items || items.length === 0) throw new Error("Order must have at least one item.");

  const [[order]] = await db.query(
    `SELECT order_status FROM checkout WHERE checkout_id = ?`,
    [orderId],
  );
  if (!order) throw new Error("Order not found.");
  if (order.order_status !== "pending") throw new Error("Can only edit pending orders.");

  await db.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);

  for (const item of items) {
    await db.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total_price) VALUES (?, ?, ?, 0)`,
      [orderId, item.menuItemId, item.quantity],
    );
  }

  const [[{ total }]] = await db.query(
    `SELECT COALESCE(SUM(line_total_price), 0) AS total FROM order_items WHERE order_id = ?`,
    [orderId],
  );
  await db.query(
    `UPDATE checkout SET total_price = ? WHERE checkout_id = ?`,
    [total, orderId],
  );

  return { success: true };
}

export async function updateOrderStatus(db, orderId, newStatus) {
  const allowed = ["preparing", "ready", "completed", "cancelled"];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  // Preparing can only be set from pending (manual promotion)
  if (newStatus === "preparing") {
    const [[current]] = await db.query(
      `SELECT order_status FROM checkout WHERE checkout_id = ?`,
      [orderId],
    );
    if (!current || current.order_status !== "pending") {
      throw new Error("Can only promote to preparing from pending.");
    }
  }

  // Restore inventory if cancelling a preparing or ready order
  if (newStatus === "cancelled") {
    const [[current]] = await db.query(
      `SELECT order_status, license_plate FROM checkout WHERE checkout_id = ?`,
      [orderId],
    );
    if (current && ["preparing", "ready"].includes(current.order_status)) {
      await db.query(
        `UPDATE truck_inventory ti
         JOIN (
           SELECT ri.ingredient_id,
                  SUM(ri.quantity_needed * oi.quantity) AS total_restore
           FROM order_items oi
           JOIN recipe_ingredient ri ON ri.menu_item_id = oi.menu_item_id
           WHERE oi.order_id = ?
           GROUP BY ri.ingredient_id
         ) amt ON amt.ingredient_id = ti.ingredient_id
         SET ti.quantity_on_hand = ti.quantity_on_hand + amt.total_restore
         WHERE ti.license_plate = ?`,
        [orderId, current.license_plate],
      );
    }
  }

  await db.query(
    `UPDATE checkout SET order_status = ? WHERE checkout_id = ?`,
    [newStatus, orderId],
  );
  return { success: true };
}
