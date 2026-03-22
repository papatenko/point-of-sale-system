import * as RecipeService from "../services/recipes.service.js";

export async function handleGetRecipes(db) {
  return await RecipeService.getAllRecipes(db);
}

export async function handleCreateRecipe(body, db) {
  return await RecipeService.createRecipe(db, body);
}

export async function handleUpdateRecipe(body, db) {
  return await RecipeService.updateRecipe(db, body);
}

export async function handleDeleteRecipe(body, db) {
  return await RecipeService.deleteRecipe(db, body);
}
