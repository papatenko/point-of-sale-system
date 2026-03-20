import mysql from "mysql2/promise";
import { getMenu } from "./routes/menu.js";
import dotenv from "dotenv";
import { checkoutOrder } from "./routes/checkout.js";
import { getOrders } from "./routes/orders.js";
import {
  getTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
} from "./routes/truck.js";
import { handleEmployeeCreate } from "./auth/create_employ.js";
import {
  createIngredient,
  getIngredients,
  deleteIngredient,
} from "./routes/ingredients.js";
import { getEmployees, deleteEmployee } from "./routes/employees.js";
import {
  getMenuItems,
  createMenuItem,
  deleteMenuItem,
} from "./routes/menu_items.js";
import {
  getSuppliers,
  createSupplier,
  deleteSupplier,
} from "./routes/suppliers.js";
import {
  getInventory,
  useInventory,
  useRecipe,
  reorderInventory,
  getInventoryAlerts,
  getInventoryHistory,
} from "./routes/Inventory.js";
import {
  getRecipes,
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "./routes/recipes.js";

// Only load .env if not in production
if (process.env.NODE_ENV !== "production") {
  dotenv.config(); // loads .env for local dev
}

let database = null;
let pool = null;

export function getDatabase() {
  if (!pool) {
    const missing = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
      (k) => !process.env[k],
    );
    if (missing.length > 0) {
      throw new Error(`Missing env vars: ${missing.join(", ")}`);
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
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
  // basePath strips the query string so "/api/inventory?licensePlate=X"
  // matches the inventory branches below without breaking existing routes.
  const basePath = url.split("?")[0];
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
    return await getTrucks(db);
  } else if (url === "/api/trucks" && method === "POST") {
    return await createTruck(body, db);
  } else if (url === "/api/trucks" && method === "PUT") {
    return await updateTruck(body, db);
  } else if (url === "/api/trucks" && method === "DELETE") {
    return await deleteTruck(body, db);
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
    return;
  } else if (url === "/api/ingredients" && method === "POST") {
    return await createIngredient(body, db);
  } else if (url === "/api/ingredients" && method === "GET") {
    return await getIngredients(db);
  } else if (url === "/api/ingredients" && method === "DELETE") {
    return await deleteIngredient(body, db);
  } else if (url === "/api/employees" && method === "GET") {
    return await getEmployees(db);
  } else if (url === "/api/employees" && method === "DELETE") {
    return await deleteEmployee(body, db);
  } else if (url === "/api/menu-items" && method === "GET") {
    return await getMenuItems(db);
  } else if (url === "/api/menu-items" && method === "POST") {
    return await createMenuItem(body, db);
  } else if (url === "/api/menu-items" && method === "DELETE") {
    return await deleteMenuItem(body, db);
  } else if (url === "/api/suppliers" && method === "GET") {
    return await getSuppliers(db);
  } else if (url === "/api/suppliers" && method === "POST") {
    return await createSupplier(body, db);
  } else if (url === "/api/suppliers" && method === "DELETE") {
    return await deleteSupplier(body, db);
  } else if (url === "/api/recipes" && method === "GET") {
    return await getRecipes(db);
  } else if (url === "/api/recipes" && method === "POST") {
    return await createRecipe(body, db);
  } else if (url === "/api/recipes" && method === "PUT") {
    return await updateRecipe(body, db);
  } else if (url === "/api/recipes" && method === "DELETE") {
    return await deleteRecipe(body, db);
    // ── Inventory routes ─────────────────────────────────────────────
    // More-specific sub-paths are checked before the bare GET so they
    // are not swallowed by the /api/inventory branch.
  } else if (basePath === "/api/inventory/use-recipe" && method === "POST") {
    return await useRecipe(body, db);
  } else if (basePath === "/api/inventory/use" && method === "POST") {
    return await useInventory(body, db);
  } else if (basePath === "/api/inventory/reorder" && method === "POST") {
    return await reorderInventory(body, db);
  } else if (basePath === "/api/inventory/alerts" && method === "GET") {
    return await getInventoryAlerts(url, db);
  } else if (basePath === "/api/inventory/history" && method === "GET") {
    return await getInventoryHistory(url, db);
  } else if (basePath === "/api/inventory" && method === "GET") {
    return await getInventory(url, db);
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
