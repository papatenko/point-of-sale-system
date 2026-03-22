import * as IngredientService from "../services/ingredients.service.js";

export function registerIngredientsRoutes(router) {
  router.get("/api/ingredients", async (_, db) => IngredientService.getAllIngredients(db));
  router.post("/api/ingredients", async (body, db) => IngredientService.createIngredient(db, body));
  router.delete("/api/ingredients", async (body, db) => IngredientService.deleteIngredient(db, body));
}
