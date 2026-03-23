import * as RecipeService from "../services/recipes.service.js";

export function registerRecipesRoutes(router) {
  router.get("/api/recipes", async (_, db) => RecipeService.getAllRecipes(db));
  router.post("/api/recipes", async (body, db) => RecipeService.createRecipe(db, body));
  router.put("/api/recipes", async (body, db) => RecipeService.updateRecipe(db, body));
  router.delete("/api/recipes", async (body, db) => RecipeService.deleteRecipe(db, body));
}
