import * as MenuItemModel from "../models/menuItems.model.js";
import * as RecipeModel from "../models/recipes.model.js";

export async function getAllMenuItems(db, status = "all") {
  return await MenuItemModel.findAll(db, status);
}

export async function getAllMenuItemsWithRecipes(db, status = "all") {
  return await MenuItemModel.findAllWithRecipes(db, status);
}

export async function getAvailableMenuItems(db) {
  return await MenuItemModel.findAvailable(db);
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

export async function deleteMenuItem(db, menu_item_id) {
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

export async function createMenuItemWithRecipes(db, itemData, recipes) {
  const { item_name, category, description, price, image_url } = itemData;

  if (!item_name || !price) {
    return { error: "Missing required fields: item_name, price" };
  }
  if (!recipes || recipes.length === 0) {
    return { error: "At least one recipe ingredient is required" };
  }

  const result = await MenuItemModel.create(db, {
    item_name,
    category,
    description,
    price,
    image_url,
  });
  const menu_item_id = result.insertId;

  const created = [];
  for (const r of recipes) {
    if (!r.ingredient_id || !r.quantity_needed) continue;
    const existing = await RecipeModel.findByMenuItemAndIngredient(
      db,
      menu_item_id,
      r.ingredient_id,
    );
    if (existing) continue;
    const recipeResult = await RecipeModel.create(db, {
      menu_item_id,
      ingredient_id: r.ingredient_id,
      quantity_needed: r.quantity_needed,
      instructions: r.instructions || null,
    });
    created.push(recipeResult.insertId);
  }

  return {
    success: true,
    menu_item_id,
    recipes_created: created.length,
    message: `Menu item created with ${created.length} recipe(s)`,
  };
}

export async function updateMenuItem(db, data) {
  const { menu_item_id, item_name, category, description, price, image_url, is_available } = data;

  if (!menu_item_id) {
    return { error: "menu_item_id is required" };
  }

  const existing = await MenuItemModel.findById(db, menu_item_id);
  if (!existing) {
    return { error: "Menu item not found" };
  }

  await MenuItemModel.update(db, menu_item_id, {
    item_name,
    category,
    description,
    price,
    image_url,
    is_available,
  });

  return {
    success: true,
    message: "Menu item updated successfully",
  };
}
