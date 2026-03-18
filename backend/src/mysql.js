import mysql from "mysql2/promise";
import { getMenu } from "./routes/menu.js";
import "dotenv/config";
import { checkoutOrder } from "./routes/checkout.js";
import { getOrders } from "./routes/orders.js";
import { getTrucks } from "./routes/truck.js";
import { handleEmployeeCreate } from "./auth/create_employ.js";

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

// Test DB ENV
console.log("DB_HOST:", process.env.DB_HOST);

export async function mySQLQuery(
  url,
  body = null,
  method = "GET",
  req = null,
  res = null,
) {
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
  } else if (url.startsWith("/api/employee/create") && method === "POST") {
    await handleEmployeeCreate(req, res, body);
    return; // Importante: return para no continuar
  } else {
    return null;
  }
}
export async function employeeCreateQuery(url, params = []) {
  // rebeca routes for auth XD
  if (url === "/api/users") {
    const [rows] = await database.query("SELECT * FROM users");
    return rows;
  } else if (url === "/api/register-user") {
    const [result] = await database.query(
      "INSERT INTO users(email, first_name, last_name, password, phone_number, user_type, gender, ethnicity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params,
    );
    return result;
  } else if (url === "/api/register-manager") {
    const [result] = await database.query(
      `INSERT INTO managers(email, budget)
       VALUES (?, ?)`,
      params,
    );
    return result;
  } else if (url === "/api/employee/create") {
    // Handle employee creation - insert into employees table
    const [result] = await database.query(
      `INSERT INTO employees 
       (email, license_plate, role, hire_date, hourly_rate) 
       VALUES (?, ?, ?, ?, ?)`,
      params,
    );
    return result;
  }

  // Default return for unhandled routes
  return { insertId: null };
}
