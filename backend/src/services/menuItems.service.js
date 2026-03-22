import * as MenuItemModel from "../models/menuItems.model.js";

export async function getAllMenuItems(db) {
  return await MenuItemModel.findAll(db);
}

export async function createMenuItem(db, data) {
  const { item_name, category, description, price, image_url } = data;

  if (!item_name || !price) {
    return {
      error: "Missing required fields: item_name, price",
    };
  }

  const result = await MenuItemModel.create(db, { item_name, category, description, price, image_url });

  return {
    success: true,
    menu_item_id: result.insertId,
    message: "Menu item created successfully",
  };
}

export async function deleteMenuItem(db, data) {
  const { menu_item_id } = data;

  if (!menu_item_id) {
    return { error: "menu_item_id is required" };
  }

  const result = await MenuItemModel.remove(db, menu_item_id);

  if (result.affectedRows === 0) {
    return { error: "Menu item not found" };
  }

  return {
    success: true,
    message: "Menu item deleted successfully",
  };
}
