import * as InventoryService from "../services/inventory.service.js";

export function registerInventoryRoutes(router) {
  router.get("/api/inventory", async (body, db, url) => InventoryService.getInventory(db, url));
  router.post("/api/inventory/use", async (body, db) => InventoryService.useInventory(db, body));
  router.post("/api/inventory/use-recipe", async (body, db) => InventoryService.useRecipe(db, body));
  router.post("/api/inventory/reorder", async (body, db) => InventoryService.reorderInventory(db, body));
  router.get("/api/inventory/alerts", async (body, db, url) => InventoryService.getAlerts(db, url));
  router.get("/api/inventory/history", async (body, db, url) => InventoryService.getHistory(db, url));
}
