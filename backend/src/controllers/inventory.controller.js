import * as InventoryService from "../services/inventory.service.js";

export async function handleGetInventory(body, db, url) {
  return await InventoryService.getInventory(db, url);
}

export async function handleUseInventory(body, db) {
  return await InventoryService.useInventory(db, body);
}

export async function handleUseRecipe(body, db) {
  return await InventoryService.useRecipe(db, body);
}

export async function handleReorderInventory(body, db) {
  return await InventoryService.reorderInventory(db, body);
}

export async function handleGetAlerts(body, db, url) {
  return await InventoryService.getAlerts(db, url);
}

export async function handleGetHistory(body, db, url) {
  return await InventoryService.getHistory(db, url);
}
