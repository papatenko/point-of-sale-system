import * as InventoryController from "../controllers/inventory.controller.js";

export function registerInventoryRoutes(router) {
  router.get("/api/inventory", async (body, db, url) => InventoryController.handleGetInventory(body, db, url));
  router.post("/api/inventory/use", async (body, db) => InventoryController.handleUseInventory(body, db));
  router.post("/api/inventory/use-recipe", async (body, db) => InventoryController.handleUseRecipe(body, db));
  router.post("/api/inventory/reorder", async (body, db) => InventoryController.handleReorderInventory(body, db));
  router.get("/api/inventory/alerts", async (body, db, url) => InventoryController.handleGetAlerts(body, db, url));
  router.get("/api/inventory/history", async (body, db, url) => InventoryController.handleGetHistory(body, db, url));
}
