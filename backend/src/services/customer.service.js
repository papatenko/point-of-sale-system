import * as CustomerModel from "../models/customers.model.js";
import * as UserModel from "../models/users.model.js";

export async function getAllCustomers(db) {
  return await CustomerModel.findAll(db);
}

export async function createCustomer(db, data) {
  const {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
    default_address,
  } = data;

  //  Validación básica
  if (!email || !first_name || !last_name || !password) {
    return {
      error: "email, first_name, last_name, and password are required",
    };
  }

  //  Verificar si ya existe usuario
  const existingUser = await UserModel.findByEmail(db, email);
  if (existingUser) {
    return { error: "User with this email already exists" };
  }

  // Crear en users primero
  await UserModel.create(db, {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
    user_type: "customer",
  });

  //crear en customers
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

  // Solo borras user → cascade elimina customer
  await CustomerModel.removeUser(db, email);

  return {
    success: true,
    message: "Customer and associated user deleted successfully",
  };
}