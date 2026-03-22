import * as UserService from "../services/users.service.js";

export function registerUsersRoutes(router) {
  router.get("/api/users", async (_, db) => UserService.getAllUsers(db));
  router.post("/api/users", async (body, db) => UserService.createUser(db, body));
  router.put("/api/users", async (body, db) => {
    const { email, ...data } = body;
    return UserService.updateUser(db, email, data);
  });
  router.delete("/api/users", async (body, db) => {
    const { email } = body;
    return UserService.deleteUser(db, email);
  });
  router.get("/api/users/genders", async (_, db) => UserService.getGenderOptions(db));
  router.get("/api/users/ethnicities", async (_, db) => UserService.getEthnicityOptions(db));
}
