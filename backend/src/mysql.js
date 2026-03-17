import mysql from "mysql2/promise";
// import { insertTransation } from "./routes/pos.js";
import "dotenv/config";

let database = null;

export async function getDatabase() {
  if (!database) {
    database = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  return database;
}

export async function mySQLQuery(url, body = null, method = "GET") {
  const db = await getDatabase();

  // ── Employee routes ──────────────────────────────────────────────
  if (url === "/api/employee") {
    return "HI FROM MYSQL";

  } else if (url === "/api/employee/pos") {
    // if (method === "POST" && body) {
    //   const result = await insertTransation(body);
    //   console.log("Transaction result:", result);
    //   return JSON.stringify(result);
    // }
    const [menuItems] = await db.query(
      "SELECT * FROM menu_items WHERE is_available = TRUE",
    );
    console.log("Fetching menu items:", menuItems.length);
    return JSON.stringify(menuItems);

  } else if (url === "/api/employee/reports") {
    // TODO
  } else if (url === "/api/employee/inventory") {
    // TODO
  } else if (url === "/api/employee/creation") {
    // TODO
  } else if (url === "/api/employee/jsearch") {
    // TODO

  // ── GET /api/trucks ──────────────────────────────────────────────
  } else if (url === "/api/trucks" && method === "GET") {
    const [rows] = await db.query(`
      SELECT license_plate, truck_name, current_location
      FROM food_trucks
      ORDER BY truck_name
    `);
    return rows;

  // ── GET /api/menu ────────────────────────────────────────────────
  } else if (url === "/api/menu" && method === "GET") {
    const [rows] = await db.query(`
      SELECT
        m.menu_item_id,
        m.item_name,
        m.category,
        c.category_name,
        m.description,
        m.price,
        m.is_available,
        m.image_url
      FROM menu_items m
      JOIN menu_category_lookup c ON m.category = c.category_id
      WHERE m.is_available = TRUE
      ORDER BY m.category, m.item_name
    `);
    return rows;

  // ── POST /api/checkout ───────────────────────────────────────────
  } else if (url === "/api/checkout" && method === "POST") {
    const { customerEmail, paymentMethod, licensePlate, items } = body;

    if (!items || items.length === 0) {
      throw new Error("Cart is empty.");
    }
    if (!licensePlate) {
      throw new Error("Please select a pickup location.");
    }

    const orderNumber = "ORD-" + Date.now();
    const total = items
      .reduce((sum, i) => sum + parseFloat(i.price) * parseInt(i.quantity), 0)
      .toFixed(2);

    const [result] = await db.query(
      `INSERT INTO checkout
         (order_number, license_plate, customer_email, order_type, order_status,
          total_price, payment_method, payment_status)
       VALUES (?, ?, ?, 'online-pickup', 'pending', ?, ?, 'pending')`,
      [orderNumber, licensePlate, customerEmail || null, total, paymentMethod]
    );
    const orderId = result.insertId;

    for (const item of items) {
      const lineTotal = (
        parseFloat(item.price) * parseInt(item.quantity)
      ).toFixed(2);
      await db.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total_price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.menuItemId, item.quantity, lineTotal]
      );
    }

    return { orderId, orderNumber };

  // ── GET /api/orders/:orderId ─────────────────────────────────────
  } else if (url.startsWith("/api/orders/") && method === "GET") {
    const orderId = url.replace("/api/orders/", "");

    const [rows] = await db.query(
      `SELECT
         c.checkout_id,
         c.order_number,
         c.order_type,
         c.order_status,
         c.total_price,
         c.payment_method,
         c.payment_status,
         c.customer_email,
         oi.order_item_id,
         oi.menu_item_id,
         oi.quantity,
         oi.line_total_price,
         m.item_name
       FROM checkout c
       JOIN order_items oi ON c.checkout_id = oi.order_id
       JOIN menu_items  m  ON oi.menu_item_id = m.menu_item_id
       WHERE c.checkout_id = ?`,
      [orderId]
    );

    if (rows.length === 0) return null;

    return {
      checkoutId:    rows[0].checkout_id,
      orderNumber:   rows[0].order_number,
      orderType:     rows[0].order_type,
      orderStatus:   rows[0].order_status,
      totalPrice:    rows[0].total_price,
      paymentMethod: rows[0].payment_method,
      paymentStatus: rows[0].payment_status,
      customerEmail: rows[0].customer_email,
      items: rows.map((r) => ({
        orderItemId: r.order_item_id,
        menuItemId:  r.menu_item_id,
        name:        r.item_name,
        quantity:    r.quantity,
        lineTotal:   r.line_total_price,
      })),
    };

  } else {
    return null;
  }
}

// Test connection on startup
getDatabase()
  .then((db) => db.query("SELECT 1 + 1 AS solution"))
  .then(([results]) => console.log("DB Connected!", results))
  .catch((err) => console.error("DB Connection failed:", err));
