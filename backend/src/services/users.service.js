import * as UserModel from "../models/users.model.js";

export async function getAllUsers(db) {
  return await UserModel.findAll(db);
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
