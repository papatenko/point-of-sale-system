import * as EmployeeController from "../controllers/employees.controller.js";

export function registerEmployeesRoutes(router) {
  router.get("/api/employees", async (_, db) => EmployeeController.handleGetEmployees(db));
  router.post("/api/employees", async (body, db) => EmployeeController.handleCreateEmployee(body, db));
  router.delete("/api/employees", async (body, db) => EmployeeController.handleDeleteEmployee(body, db));
}
