import * as MenuItemController from "../controllers/menuItems.controller.js";

export function registerMenuItemsRoutes(router) {
  router.get("/api/menu-items", async (_, db) => MenuItemController.handleGetMenuItems(db));
  router.post("/api/menu-items", async (body, db) => MenuItemController.handleCreateMenuItem(body, db));
  router.delete("/api/menu-items", async (body, db) => MenuItemController.handleDeleteMenuItem(body, db));
}
