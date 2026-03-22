import * as EmployeeModel from "../models/employees.model.js";

export async function getAllEmployees(db) {
  return await EmployeeModel.findAll(db);
}

export async function deleteEmployee(db, data) {
  const { email } = data;

  if (!email) {
    return { error: "email is required" };
  }

  const existing = await EmployeeModel.findByEmail(db, email);
  if (!existing) {
    return { error: "Employee not found" };
  }

  await EmployeeModel.remove(db, email);
  await EmployeeModel.removeUser(db, email);

  return {
    success: true,
    message: "Employee and associated user deleted successfully",
  };
}
