import mysql from "mysql2/promise";
import { insertTransation } from "./routes/pos.js";
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
  if (url === "/api/employee") {
    return "HI FROM MYSQL";
  } else if (url === "/api/employee/pos") {
    if (method === "POST" && body) {
      const result = await insertTransation(body);
      console.log("Transaction result:", result);
      return JSON.stringify(result);
    }
    const [menuItems] = await database.query(
      "SELECT * FROM menu_items WHERE is_available = TRUE",
    );
    console.log("Fetching menu items:", menuItems.length);
    return JSON.stringify(menuItems);
  } else if (url === "/api/employee/reports") {
    database.query();
  } else if (url === "/api/employee/inventory") {
    database.query();
  } else if (url === "/api/employee/creation") {
    database.query();
  } else if (url === "/api/employee/jsearch") {
    database.query();
  } else {
    return "";
  }
}

// Test connection
try {
  const [results] = await database.query("SELECT 1 + 1 AS solution");
  console.log("Connected!", results);
} catch (err) {
  console.error("Connection failed:", err);
}
