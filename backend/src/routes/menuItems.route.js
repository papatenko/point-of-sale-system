import * as MenuItemService from "../services/menuItems.service.js";

export function registerMenuItemsRoutes(router) {
  router.get("/api/menu", async (_, db) => MenuItemService.getAvailableMenuItems(db));
  router.get("/api/menu-items", async (_, db) => MenuItemService.getAllMenuItems(db));
  router.post("/api/menu-items", async (body, db) => MenuItemService.createMenuItem(db, body));
  router.delete("/api/menu-items", async (body, db) => MenuItemService.deleteMenuItem(db, body));
}
