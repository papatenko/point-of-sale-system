import { createRouter } from "./utils/router.js";
import * as UserService from "./services/users.service.js";
import * as EmployeeService from "./services/employees.service.js";
import * as IngredientService from "./services/ingredients.service.js";
import * as TruckService from "./services/trucks.service.js";
import * as SupplierService from "./services/suppliers.service.js";
import * as MenuItemService from "./services/menuItems.service.js";
import * as RecipeService from "./services/recipes.service.js";
import * as OrderService from "./services/orders.service.js";
import * as InventoryService from "./services/inventory.service.js";
import * as BackupService from "./services/backup.service.js";
import * as CustomerService from "./services/customer.service.js";
import * as CheckoutService from "./services/checkout.service.js";
import * as ReportModel from "./models/report.model.js";
import { login, register } from "./auth/auth.js";
import * as SearchService from "./services/searchService.js";

const router = createRouter();

// Auth
router.post("/api/login", async (body) => login(body.email, body.password));
router.post("/api/register", async (body) => {
  const { email, password, first_name, last_name, phone_number } = body;
  if (!email || !password || !first_name || !last_name || !phone_number) {
    return { error: "All fields are required" };
  }
  await register(email, password, first_name, last_name, phone_number);
  return await login(email, password);
});

// User Profile
router.get("/api/me", async (_, db, req) => UserService.getMyProfile(req, db));
router.put("/api/me", async (body, db, req) =>
  UserService.updateMyProfile(req, body, db),
);

// Users
router.get("/api/users", async (_, db) => UserService.getAllUsers(db));
router.post("/api/users", async (body, db) => UserService.createUser(db, body));
router.put("/api/users", async (body, db) => {
  const { email, ...data } = body;
  return UserService.updateUser(db, email, data);
});
router.delete("/api/users", async (body, db) => {
  const { email } = body;
  return UserService.deleteUser(db, email);
});
router.get("/api/users/genders", async (_, db) =>
  UserService.getGenderOptions(db),
);
router.get("/api/users/ethnicities", async (_, db) =>
  UserService.getEthnicityOptions(db),
);

// Employees
router.get("/api/employees", async (_, db) =>
  EmployeeService.getAllEmployees(db),
);
router.post("/api/employees", async (body, db) =>
  EmployeeService.createEmployee(db, body),
);
router.delete("/api/employees", async (body, db) => {
  const { email } = body;
  return EmployeeService.deleteEmployee(db, email);
});

// Ingredients
router.get("/api/ingredients", async (_, db) =>
  IngredientService.getAllIngredients(db),
);
router.post("/api/ingredients", async (body, db) =>
  IngredientService.createIngredient(db, body),
);
router.delete("/api/ingredients", async (body, db) => {
  const { ingredient_id } = body;
  return IngredientService.deleteIngredient(db, ingredient_id);
});

// Trucks
router.get("/api/trucks", async (_, db) => TruckService.getAllTrucks(db));
router.post("/api/trucks", async (body, db) =>
  TruckService.createTruck(db, body),
);
router.put("/api/trucks", async (body, db) =>
  TruckService.updateTruck(db, body),
);
router.delete("/api/trucks", async (body, db) => {
  const { license_plate } = body;
  return TruckService.deleteTruck(db, license_plate);
});

// Suppliers
router.get("/api/suppliers", async (_, db) =>
  SupplierService.getAllSuppliers(db),
);
router.post("/api/suppliers", async (body, db) =>
  SupplierService.createSupplier(db, body),
);
router.delete("/api/suppliers", async (body, db) => {
  const { supplier_id } = body;
  return SupplierService.deleteSupplier(db, supplier_id);
});

// Menu Items
router.get("/api/menu", async (_, db) =>
  MenuItemService.getAvailableMenuItems(db),
);
router.get("/api/menu-items", async (_, db) =>
  MenuItemService.getAllMenuItemsWithRecipes(db),
);
router.post("/api/menu-items", async (body, db) =>
  MenuItemService.createMenuItem(db, body),
);
router.post("/api/menu-items-with-recipes", async (body, db) => {
  const { item_name, category, description, price, image_url, recipes } = body;
  if (!item_name || !price) {
    return { error: "Missing required fields: item_name, price" };
  }
  if (!recipes || recipes.length === 0) {
    return { error: "At least one recipe ingredient is required" };
  }
  return await MenuItemService.createMenuItemWithRecipes(
    db,
    { item_name, category, description, price, image_url },
    recipes,
  );
});
router.put("/api/menu-items", async (body, db) =>
  MenuItemService.updateMenuItem(db, body),
);
router.delete("/api/menu-items", async (body, db) => {
  const { menu_item_id } = body;
  return MenuItemService.deleteMenuItem(db, menu_item_id);
});

// Recipes
router.get("/api/recipes", async (_, db) => RecipeService.getAllRecipes(db));
router.post("/api/recipes", async (body, db) =>
  RecipeService.createRecipe(db, body),
);
router.put("/api/recipes", async (body, db) =>
  RecipeService.updateRecipe(db, body),
);
router.delete("/api/recipes", async (body, db) => {
  const { recipe_id } = body;
  return RecipeService.deleteRecipe(db, recipe_id);
});

// Orders
router.get("/api/orders", async (_, db, req, url) =>
  OrderService.listOrders(db, req, url),
);
router.get("/api/orders/:id", async (_, db, _req, url) =>
  OrderService.getOrderById(db, url),
);
router.patch("/api/orders/:id/status", async (body, db, _req, _url, params) =>
  OrderService.updateOrderStatus(db, params.id, body.status),
);
router.put("/api/orders/:id/items", async (body, db, _req, _url, params) =>
  OrderService.updateOrderItems(db, params.id, body.items),
);

// Inventory
router.get("/api/inventory", async (_, db, _req, url) =>
  InventoryService.getInventory(db, url),
);
router.post("/api/inventory/use", async (body, db) =>
  InventoryService.useInventory(db, body),
);
router.post("/api/inventory/expire", async (body, db) =>
  InventoryService.expireInventory(db, body),
);
router.post("/api/inventory/reorder", async (body, db) =>
  InventoryService.reorderInventory(db, body),
);
router.get("/api/inventory/alerts", async (_, db, _req, url) =>
  InventoryService.getAlerts(db, url),
);
router.get("/api/inventory/history", async (_, db, _req, url) =>
  InventoryService.getHistory(db, url),
);
router.get("/api/inventory/today-sales", async (_, db, _req, url) =>
  InventoryService.getTodaysSales(db, url),
);
// Pending supply orders — managers and admins only
router.get("/api/inventory/pending-orders", async (_, db, req, url) =>
  InventoryService.getPendingSupplyOrders(db, url, req),
);
// Receive a supply order — managers and admins only
router.post("/api/inventory/receive-order", async (body, db, req) =>
  InventoryService.receiveSupplyOrder(db, body, req),
);

// Backup
router.get("/api/backup", async () => BackupService.createBackup());

// Customers
router.get("/api/customers", async (_, db) =>
  CustomerService.getAllCustomers(db),
);
router.post("/api/customers", async (body, db) =>
  CustomerService.createCustomer(db, body),
);
router.delete("/api/customers", async (body, db) => {
  const { email } = body;
  return CustomerService.deleteCustomer(db, email);
});

// Checkout — customer online orders
router.post("/api/checkout", async (body, db, req) =>
  CheckoutService.createCheckout(
    db,
    { ...body, orderType: "online-pickup" },
    req,
  ),
);

// POS checkout — walk-in orders, truck auto-assigned from JWT
router.post("/api/pos/checkout", async (body, db, req) =>
  CheckoutService.createCheckout(db, { ...body, orderType: "walk-in" }, req),
);

// Reports
router.get("/api/reports/stats", async (_, db, _req, url) =>
  ReportModel.getReportStats(db, url),
);

// POS
router.get("/api/employee/pos", async (_, db) => {
  const [menuItems] = await db.query(
    "SELECT * FROM menu_items WHERE is_available = TRUE",
  );
  return menuItems;
});

// Get the truck for the current user (manager/employee)
router.get("/api/trucks/for-user", async (_, db, req) =>
  TruckService.getTruckForUser(db, req),
);

//search
router.get("/api/search", async (_, db, _req, url) => {
  const params = new URLSearchParams(url.split("?")[1]);

  const table = params.get("table");
  const q = params.get("q");

  if (!table || !q) {
    return { error: "Missing table or query" };
  }

  return await SearchService.search(db, table, q);
});

export async function handleRoute(url, body, method, req, res, db) {
  const basePath = url.split("?")[0];
  
  return await router.match(method, basePath, body, db, req, url);
}
