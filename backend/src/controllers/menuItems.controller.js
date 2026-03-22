import * as MenuItemService from "../services/menuItems.service.js";

export async function handleGetMenuItems(db) {
  return await MenuItemService.getAllMenuItems(db);
}

export async function handleGetAvailableMenuItems(db) {
  return await MenuItemService.getAvailableMenuItems(db);
}

export async function handleCreateMenuItem(body, db) {
  return await MenuItemService.createMenuItem(db, body);
}

export async function handleDeleteMenuItem(body, db) {
  return await MenuItemService.deleteMenuItem(db, body);
}
