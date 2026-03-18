import mysql from "mysql2/promise";
import { getMenu } from "./routes/menu.js";
import "dotenv/config";
import { checkoutOrder } from "./routes/checkout.js";
import { getOrders } from "./routes/orders.js";
import { getTrucks } from "./routes/truck.js";

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
    return getTrucks(db);
    // ── GET /api/menu ────────────────────────────────────────────────
  } else if (url === "/api/menu" && method === "GET") {
    return await getMenu();
    // ── POST /api/checkout ───────────────────────────────────────────
  } else if (url === "/api/checkout" && method === "POST") {
    return checkoutOrder(body, db);
    // ── GET /api/orders/:orderId ─────────────────────────────────────
  } else if (url.startsWith("/api/orders/") && method === "GET") {
    return getOrders(url, db);
  } else {
    return null;
  }
}

// Test connection on startup
getDatabase()
  .then((db) => db.query("SELECT 1 + 1 AS solution"))
  .then(([results]) => console.log("DB Connected!", results))
  .catch((err) => console.error("DB Connection failed:", err));
