import * as CustomerModel from "../models/customer.model.js";
// import * as UserService from "./users.service.js";

export async function getAllCustomers(db) {
  return await CustomerModel.findAll(db);
}

export async function createCustomer(db, data) {
  const { email, default_address } = data;

  if (!email) {
    return { error: "email is required" };
  }

  const userExists = await CustomerModel.emailExistsAsUser(db, email);
  if (!userExists) {
    return { error: "User must exist in users table before creating customer" };
  }

  const existingCustomer = await CustomerModel.findByEmail(db, email);
  if (existingCustomer) {
    return { error: "Customer already exists" };
  }

  const result = await CustomerModel.create(db, {
    email,
    default_address,
  });

  return {
    success: true,
    customer_id: result.insertId,
    message: "Customer created successfully",
  };
}

export async function deleteCustomer(db, data) {
  const { email } = data;

  if (!email) {
    return { error: "email is required" };
  }

  const existing = await CustomerModel.findByEmail(db, email);
  if (!existing) {
    return { error: "Customer not found" };
  }

  await CustomerModel.remove(db, email);
  await CustomerModel.removeUser(db, email);

  return {
    success: true,
    message: "Customer and associated user deleted successfully",
  };
}