import { createRouter } from "../utils/router.js";
import { registerUsersRoutes } from "./users.route.js";
import { registerRecipesRoutes } from "./recipes.route.js";
import { registerTrucksRoutes } from "./trucks.route.js";
import { registerSuppliersRoutes } from "./suppliers.route.js";
import { registerMenuItemsRoutes } from "./menuItems.route.js";
import { registerEmployeesRoutes } from "./employees.route.js";
import { registerIngredientsRoutes } from "./ingredients.route.js";
import { registerInventoryRoutes } from "./inventory.route.js";
import { registerOrdersRoutes } from "./orders.route.js";

import { checkoutOrder } from "./checkout.js";
import { getMyProfile, updateMyProfile } from "./users.js";
import { getReportStats } from "./reports.js";
import { login } from "../auth/auth.js";

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

const inventoryRouter = createRouter();
registerInventoryRoutes(inventoryRouter);

const ordersRouter = createRouter();
registerOrdersRoutes(ordersRouter);

export async function handleRoute(url, body, method, req, res, db) {
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
  } else if (url === "/api/checkout" && method === "POST") {
    return checkoutOrder(body, db);
    // Checks for available menu items
  } else if (url.startsWith("/api/menu")) {
    return await menuItemsRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/orders")) {
    return await ordersRouter.match(method, basePath, body, db, url);
  } else if (url.startsWith("/api/ingredients")) {
    return await ingredientsRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/employees")) {
    return await employeesRouter.match(method, basePath, body, db);
    // Checks for all menu items
  } else if (url.startsWith("/api/menu-items")) {
    return await menuItemsRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/suppliers")) {
    return await suppliersRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/recipes")) {
    return await recipesRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/users")) {
    return await usersRouter.match(method, basePath, body, db);
  } else if (url.startsWith("/api/inventory")) {
    return await inventoryRouter.match(method, basePath, body, db, url);
  } else if (url === "/api/login" && method === "POST") {
    return await login(body.email, body.password);
  } else {
    return null;
  }
}
