import * as RecipeController from "../controllers/recipes.controller.js";

export function registerRecipesRoutes(router) {
  router.get("/api/recipes", async (_, db) => RecipeController.handleGetRecipes(db));
  router.post("/api/recipes", async (body, db) => RecipeController.handleCreateRecipe(body, db));
  router.put("/api/recipes", async (body, db) => RecipeController.handleUpdateRecipe(body, db));
  router.delete("/api/recipes", async (body, db) => RecipeController.handleDeleteRecipe(body, db));
}
