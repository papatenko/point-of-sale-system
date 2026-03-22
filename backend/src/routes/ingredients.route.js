import * as IngredientController from "../controllers/ingredients.controller.js";

export function registerIngredientsRoutes(router) {
  router.get("/api/ingredients", async (_, db) => IngredientController.handleGetIngredients(db));
  router.post("/api/ingredients", async (body, db) => IngredientController.handleCreateIngredient(body, db));
  router.delete("/api/ingredients", async (body, db) => IngredientController.handleDeleteIngredient(body, db));
}
