import * as RecipeModel from "../models/recipes.model.js";

export async function getAllRecipes(db) {
  return await RecipeModel.findAll(db);
}

export async function getRecipesByMenuItem(db, menuItemId) {
  return await RecipeModel.findByMenuItem(db, menuItemId);
}

export async function createRecipe(db, data) {
  const { menu_item_id, ingredient_id, quantity_needed, instructions } = data;

  if (!menu_item_id || !ingredient_id || !quantity_needed) {
    return {
      error: "Missing required fields: menu_item_id, ingredient_id, quantity_needed",
    };
  }

  const menuItem = await RecipeModel.menuItemExists(db, menu_item_id);
  if (!menuItem) {
    return { error: "Menu item not found" };
  }

  const ingredient = await RecipeModel.ingredientExists(db, ingredient_id);
  if (!ingredient) {
    return { error: "Ingredient not found" };
  }

  const existing = await RecipeModel.findByMenuItemAndIngredient(db, menu_item_id, ingredient_id);
  if (existing) {
    return { error: "This ingredient is already in the recipe for this menu item" };
  }

  const result = await RecipeModel.create(db, { menu_item_id, ingredient_id, quantity_needed, instructions });

  return {
    success: true,
    recipe_id: result.insertId,
    message: "Recipe ingredient added successfully",
  };
}

export async function updateRecipe(db, data) {
  const { recipe_id, quantity_needed, instructions } = data;

  if (!recipe_id) {
    return { error: "recipe_id is required" };
  }

  const existing = await RecipeModel.findById(db, recipe_id);
  if (!existing) {
    return { error: "Recipe not found" };
  }

  await RecipeModel.update(db, recipe_id, { quantity_needed, instructions });

  return {
    success: true,
    message: "Recipe updated successfully",
  };
}

export async function deleteRecipe(db, recipe_id) {
  if (!recipe_id) {
    return { error: "recipe_id is required" };
  }

  const existing = await RecipeModel.findById(db, recipe_id);
  if (!existing) {
    return { error: "Recipe not found" };
  }

  await RecipeModel.remove(db, recipe_id);

  return {
    success: true,
    message: "Recipe ingredient removed successfully",
  };
}
