import * as EmployeeService from "../services/employees.service.js";

export function registerEmployeesRoutes(router) {
  router.get("/api/employees", async (_, db) => EmployeeService.getAllEmployees(db));
  router.post("/api/employees", async (body, db) => EmployeeService.createEmployee(db, body));
  router.delete("/api/employees", async (body, db) => EmployeeService.deleteEmployee(db, body));
}
