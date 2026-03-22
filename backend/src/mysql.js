import mysql from "mysql2/promise";
import { getMenu } from "./routes/menu.js";
import dotenv from "dotenv";
import { checkoutOrder } from "./routes/checkout.js";
import { getOrders } from "./routes/orders.js";
import {
  getInventory,
  useInventory,
  useRecipe,
  reorderInventory,
  getInventoryAlerts,
  getInventoryHistory,
} from "./routes/Inventory.js";
import { getMyProfile, updateMyProfile } from "./routes/users.js";
import { getReportStats } from "./routes/reports.js";
import { login } from "./auth/auth.js";
import { createRouter } from "./utils/router.js";
import { registerUsersRoutes } from "./routes/users.route.js";
import { registerRecipesRoutes } from "./routes/recipes.route.js";
import { registerTrucksRoutes } from "./routes/trucks.route.js";
import { registerSuppliersRoutes } from "./routes/suppliers.route.js";
import { registerMenuItemsRoutes } from "./routes/menuItems.route.js";
import { registerEmployeesRoutes } from "./routes/employees.route.js";
import { registerIngredientsRoutes } from "./routes/ingredients.route.js";

const usersRouter = createRouter();
registerUsersRoutes(usersRouter);

const recipesRouter = createRouter();
registerRecipesRoutes(recipesRouter);

const trucksRouter = createRouter();
registerTrucksRoutes(trucksRouter);

const suppliersRouter = createRouter();
registerSuppliersRoutes(suppliersRouter);

const menuItemsRouter = createRouter();
registerMenuItemsRoutes(menuItemsRouter);

const employeesRouter = createRouter();
registerEmployeesRoutes(employeesRouter);

const ingredientsRouter = createRouter();
registerIngredientsRoutes(ingredientsRouter);

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

let pool = null;

export async function getDatabase() {
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

console.log("DB_HOST:", process.env.DB_HOST);

export async function mySQLQuery(
  url,
  body = null,
  method = "GET",
  req = null,
  res = null,
) {
  const db = await getDatabase();
  const basePath = url.split("?")[0];

  if (url === "/api/employee") {
    return "HI FROM MYSQL";
  } else if (url === "/api/employee/pos") {
    const [menuItems] = await db.query(
      "SELECT * FROM menu_items WHERE is_available = TRUE",
    );
    console.log("Fetching menu items:", menuItems.length);
    return JSON.stringify(menuItems);
  } else if (basePath === "/api/reports/stats" && method === "GET") {
    return await getReportStats(db);
  } else if (basePath === "/api/me" && method === "GET") {
    return await getMyProfile(req, db);
  } else if (basePath === "/api/me" && method === "PUT") {
    return await updateMyProfile(req, body, db);
  } else if (url.startsWith("/api/trucks")) {
    return await trucksRouter.match(method, basePath, body, db);
  } else if (url === "/api/menu" && method === "GET") {
    return await getMenu();
  } else if (url === "/api/checkout" && method === "POST") {
    return checkoutOrder(body, db);
  } else if (url.startsWith("/api/orders/") && method === "GET") {
    return getOrders(url, db);
  } else if (url.startsWith("/api/ingredients")) {
    return await ingredientsRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/employees")) {
    return await employeesRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/menu-items")) {
    return await menuItemsRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/suppliers")) {
    return await suppliersRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/recipes")) {
    return await recipesRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/users")) {
    return await usersRouter.match(method, basePath, body, db);
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
  } else if (url === "/api/login" && method === "POST") {
    return await login(body.email, body.password);
  } else {
    return null;
  }
}
