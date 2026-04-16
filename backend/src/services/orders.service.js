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
                              c.cashier_email, c.cancel_reason,
                              c.scheduled_time, c.license_plate, c.date_created,
                              u.phone_number AS customer_phone,
                              ft.current_location AS truck_location,
                              ce.first_name AS cashier_first_name,
                              ce.last_name  AS cashier_last_name,
                              GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) ORDER BY mi.item_name SEPARATOR ' | ') AS items,
                              (SELECT GROUP_CONCAT(DISTINCT mi2.item_name ORDER BY mi2.item_name SEPARATOR ' | ')
                               FROM order_items oi2
                               JOIN recipe_ingredient ri ON ri.menu_item_id = oi2.menu_item_id
                               LEFT JOIN truck_inventory ti
                                      ON ti.ingredient_id = ri.ingredient_id
                                     AND ti.license_plate = c.license_plate
                               JOIN menu_items mi2 ON mi2.menu_item_id = oi2.menu_item_id
                               WHERE oi2.order_id = c.checkout_id
                                 AND (ti.quantity_on_hand IS NULL
                                      OR ti.quantity_on_hand < ri.quantity_needed * oi2.quantity)
                              ) AS inventory_warning,
                              (SELECT GROUP_CONCAT(DISTINCT mi3.item_name ORDER BY mi3.item_name SEPARATOR ' | ')
                               FROM order_items oi3
                               JOIN recipe_ingredient ri3 ON ri3.menu_item_id = oi3.menu_item_id
                               LEFT JOIN truck_inventory ti3
                                      ON ti3.ingredient_id = ri3.ingredient_id
                                     AND ti3.license_plate = c.license_plate
                               JOIN menu_items mi3 ON mi3.menu_item_id = oi3.menu_item_id
                               WHERE oi3.order_id = c.checkout_id
                                 AND ti3.expiration_date IS NOT NULL
                                 AND ti3.expiration_date <= NOW()
                                 AND ti3.quantity_on_hand > 0
                              ) AS expired_warning
                       FROM checkout c
                       LEFT JOIN order_items oi ON oi.order_id = c.checkout_id
                       LEFT JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
                       LEFT JOIN users u ON u.email = c.customer_email
                       LEFT JOIN food_trucks ft ON ft.license_plate = c.license_plate
                       LEFT JOIN users ce ON ce.email = c.cashier_email
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
                            c.cashier_email, c.cancel_reason,
                            c.scheduled_time, c.license_plate, c.date_created,
                            u.phone_number AS customer_phone,
                            ft.current_location AS truck_location,
                            ce.first_name AS cashier_first_name,
                            ce.last_name  AS cashier_last_name,
                            GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) ORDER BY mi.item_name SEPARATOR ' | ') AS items,
                            (SELECT GROUP_CONCAT(DISTINCT mi2.item_name ORDER BY mi2.item_name SEPARATOR ' | ')
                             FROM order_items oi2
                             JOIN recipe_ingredient ri ON ri.menu_item_id = oi2.menu_item_id
                             LEFT JOIN truck_inventory ti
                                    ON ti.ingredient_id = ri.ingredient_id
                                   AND ti.license_plate = c.license_plate
                             JOIN menu_items mi2 ON mi2.menu_item_id = oi2.menu_item_id
                             WHERE oi2.order_id = c.checkout_id
                               AND (ti.quantity_on_hand IS NULL
                                    OR ti.quantity_on_hand < ri.quantity_needed * oi2.quantity)
                            ) AS inventory_warning,
                            (SELECT GROUP_CONCAT(DISTINCT mi3.item_name ORDER BY mi3.item_name SEPARATOR ' | ')
                             FROM order_items oi3
                             JOIN recipe_ingredient ri3 ON ri3.menu_item_id = oi3.menu_item_id
                             LEFT JOIN truck_inventory ti3
                                    ON ti3.ingredient_id = ri3.ingredient_id
                                   AND ti3.license_plate = c.license_plate
                             JOIN menu_items mi3 ON mi3.menu_item_id = oi3.menu_item_id
                             WHERE oi3.order_id = c.checkout_id
                               AND ti3.expiration_date IS NOT NULL
                               AND ti3.expiration_date <= NOW()
                               AND ti3.quantity_on_hand > 0
                            ) AS expired_warning
                     FROM checkout c
                     LEFT JOIN order_items oi ON oi.order_id = c.checkout_id
                     LEFT JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
                     LEFT JOIN users u ON u.email = c.customer_email
                     LEFT JOIN food_trucks ft ON ft.license_plate = c.license_plate
                     LEFT JOIN users ce ON ce.email = c.cashier_email
                     ${where}
                     GROUP BY c.checkout_id
                     ${orderBy}`;
  const [rows] = await db.query(dataQuery, params);
  return rows;
}

export async function updateOrderItems(db, orderId, items, req = null) {
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

  // Update cashier_email to the employee who edited the order
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const employeeEmail = verifyToken(token)?.email ?? null;
  if (employeeEmail) {
    await db.query(
      `UPDATE checkout SET cashier_email = ? WHERE checkout_id = ?`,
      [employeeEmail, orderId],
    );
  }

  return { success: true };
}

export async function updateOrderStatus(db, orderId, newStatus, req = null, cancelReason = null) {
  const allowed = ["preparing", "ready", "completed", "cancelled"];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  // Extract actor from JWT
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);
  const isEmployee = payload?.user_type !== "customer";
  const employeeEmail = isEmployee ? (payload?.email ?? null) : null;

  // Customer auth: can only cancel their own pending orders
  if (payload?.user_type === "customer") {
    if (newStatus !== "cancelled") throw new Error("Customers can only cancel orders.");
    const [[owned]] = await db.query(
      `SELECT customer_email, order_status FROM checkout WHERE checkout_id = ?`,
      [orderId],
    );
    if (!owned || owned.customer_email !== payload.email)
      throw new Error("Not authorized to cancel this order.");
    if (owned.order_status !== "pending")
      throw new Error("Only pending orders can be cancelled.");
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

  // Restore inventory and log adjustments if cancelling a preparing order
  if (newStatus === "cancelled") {
    const [[current]] = await db.query(
      `SELECT order_status, license_plate FROM checkout WHERE checkout_id = ?`,
      [orderId],
    );
    if (current && current.order_status === "ready") {
      throw new Error("Ready orders cannot be cancelled.");
    }
    if (current && current.order_status === "preparing") {
      // Fetch per-ingredient restore amounts
      const [ingredients] = await db.query(
        `SELECT ri.ingredient_id,
                SUM(ri.quantity_needed * oi.quantity) AS total_restore
         FROM order_items oi
         JOIN recipe_ingredient ri ON ri.menu_item_id = oi.menu_item_id
         WHERE oi.order_id = ?
         GROUP BY ri.ingredient_id`,
        [orderId],
      );

      // Restore truck_inventory
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

      // Log each ingredient restore to inventory_adjustments
      for (const ing of ingredients) {
        await db.query(
          `INSERT INTO inventory_adjustments
             (license_plate, ingredient_id, adjustment_type, quantity_change,
              reason, adjusted_by)
           VALUES (?, ?, 'order-cancel', ?, ?, ?)`,
          [
            current.license_plate,
            ing.ingredient_id,
            ing.total_restore,
            `Order #${orderId} cancelled`,
            employeeEmail,
          ],
        );
      }
    }
  }

  // Build dynamic SET clause for the checkout UPDATE
  const setClauses = ["order_status = ?"];
  const setValues  = [newStatus];

  if (newStatus === "cancelled") {
    // Always set cancel_reason
    const reason = isEmployee ? (cancelReason ?? "Other") : "Customer Request";
    setClauses.push("cancel_reason = ?");
    setValues.push(reason);
    // Update cashier_email only when an employee cancels
    if (employeeEmail) {
      setClauses.push("cashier_email = ?");
      setValues.push(employeeEmail);
    }
  }

  await db.query(
    `UPDATE checkout SET ${setClauses.join(", ")} WHERE checkout_id = ?`,
    [...setValues, orderId],
  );
  return { success: true };
}
