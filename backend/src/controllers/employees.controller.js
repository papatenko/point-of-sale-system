import * as EmployeeService from "../services/employees.service.js";

export async function handleGetEmployees(db) {
  return await EmployeeService.getAllEmployees(db);
}

export async function handleCreateEmployee(body, db) {
  return await EmployeeService.createEmployee(db, body);
}

export async function handleDeleteEmployee(body, db) {
  return await EmployeeService.deleteEmployee(db, body);
}
