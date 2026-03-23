import * as UserModel from "../models/users.model.js";

export async function getAllUsers(db) {
  return await UserModel.findAll(db);
}

export async function createUser(db, data) {
  const { email, first_name, last_name, password, phone_number, gender, ethnicity } = data;

  if (!email || !first_name || !last_name || !password) {
    return { error: "email, first_name, last_name, and password are required" };
  }

  const existing = await UserModel.findByEmail(db, email);
  if (existing) {
    return { error: "User with this email already exists" };
  }

  const result = await UserModel.create(db, {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
    user_type: "employee",
  });

  return {
    success: true,
    email: result.insertId,
    message: "User created successfully",
  };
}

export async function updateUser(db, email, data) {
  if (!email) {
    return { error: "email is required" };
  }

  const existing = await UserModel.findByEmail(db, email);
  if (!existing) {
    return { error: "User not found" };
  }

  await UserModel.update(db, email, data);
  return { success: true, message: "User updated successfully" };
}

export async function deleteUser(db, email) {
  if (!email) {
    return { error: "email is required" };
  }

  const existing = await UserModel.findByEmail(db, email);
  if (!existing) {
    return { error: "User not found" };
  }

  await UserModel.remove(db, email);
  return { success: true, message: "User deleted successfully" };
}

export async function getGenderOptions(db) {
  return await UserModel.findAllGenders(db);
}

export async function getEthnicityOptions(db) {
  return await UserModel.findAllEthnicities(db);
}
