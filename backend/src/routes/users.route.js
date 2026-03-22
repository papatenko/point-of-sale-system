import * as UserController from "../controllers/users.controller.js";

export function registerUsersRoutes(router) {
  router.get("/api/users", async (_, db) => UserController.handleGetUsers(db));
  router.put("/api/users", async (body, db) => UserController.handleUpdateUser(body, db));
  router.delete("/api/users", async (body, db) => UserController.handleDeleteUser(body, db));
  router.get("/api/users/genders", async (_, db) => UserController.handleGetGenders(db));
  router.get("/api/users/ethnicities", async (_, db) => UserController.handleGetEthnicities(db));
}
