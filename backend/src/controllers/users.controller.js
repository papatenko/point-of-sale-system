import * as UserService from "../services/users.service.js";

export async function handleGetUsers(db) {
  return await UserService.getAllUsers(db);
}

export async function handleCreateUser(body, db) {
  return await UserService.createUser(db, body);
}

export async function handleUpdateUser(body, db) {
  const { email, ...data } = body;
  return await UserService.updateUser(db, email, data);
}

export async function handleDeleteUser(body, db) {
  const { email } = body;
  return await UserService.deleteUser(db, email);
}

export async function handleGetGenders(db) {
  return await UserService.getGenderOptions(db);
}

export async function handleGetEthnicities(db) {
  return await UserService.getEthnicityOptions(db);
}
