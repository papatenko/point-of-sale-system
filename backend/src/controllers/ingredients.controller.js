import * as IngredientService from "../services/ingredients.service.js";

export async function handleGetIngredients(db) {
  return await IngredientService.getAllIngredients(db);
}

export async function handleCreateIngredient(body, db) {
  return await IngredientService.createIngredient(db, body);
}

export async function handleDeleteIngredient(body, db) {
  return await IngredientService.deleteIngredient(db, body);
}
