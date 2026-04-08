import * as EmployeeModel from "../models/employees.model.js";
import * as TruckService from "./trucks.service.js";

export async function getAllEmployees(db) {
  return await EmployeeModel.findAll(db);
}

export async function createEmployee(db, data) {
  const { email, license_plate, role, hire_date } = data;

  if (!email) {
    return { error: "email is required" };
  }

  if (!role) {
    return { error: "role is required" };
  }

  const userExists = await EmployeeModel.emailExistsAsUser(db, email);
  if (!userExists) {
    return { error: "User must exist in users table before creating employee" };
  }

  const existingEmployee = await EmployeeModel.findByEmail(db, email);
  if (existingEmployee) {
    return { error: "Employee already exists" };
  }

  let finalLicensePlate = license_plate;
  if (!finalLicensePlate) {
    const trucks = await TruckService.getAllTrucks(db);
    finalLicensePlate = trucks[0]?.license_plate || "ABC-123";
  }

  const result = await EmployeeModel.create(db, {
    email,
    license_plate: finalLicensePlate,
    role,
    hire_date,
  });

  if (role === "manager") {
    await EmployeeModel.createManager(db, email);
  }

  return {
    success: true,
    employee_id: result.insertId,
    message: "Employee created successfully",
  };
}

export async function deleteEmployee(db, email) {
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

export async function updateEmployee(db, email, data) {
  if (!email) {
    return { error: "email is required" };
  }

  const existing = await EmployeeModel.findByEmail(db, email);
  if (!existing) {
    return { error: "Employee not found" };
  }

  await EmployeeModel.update(db, email, data);
  return { success: true, message: "Employee updated successfully" };
}
