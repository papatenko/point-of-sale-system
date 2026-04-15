import * as UserModel from "../models/users.model.js";
import { verifyToken } from "../auth/jwt.js";

function getAuthEmail(req) {
  const header = req?.headers?.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const payload = verifyToken(token);
  return payload?.email ?? null;
}

export async function getMyProfile(req, db) {
  const email = getAuthEmail(req);
  if (!email) return { error: "Unauthorized" };

  const [[row]] = await db.query(
    `
    SELECT u.email, u.first_name, u.last_name, u.phone_number, u.gender, u.ethnicity,
           g.gender AS gender_name, r.race AS race_name
    FROM users u
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
    WHERE u.email = ?  
    AND u.user_type IS NOT NULL`,
    [email],
  );

  if (!row) return { error: "User not found" };
  return row;
}

export async function updateMyProfile(req, body, db) {
  const email = getAuthEmail(req);
  if (!email) return { error: "Unauthorized" };

  const { first_name, last_name, phone_number, gender, ethnicity, password } =
    body || {};
  if (!first_name || !last_name)
    return { error: "first_name and last_name are required" };

  const [[existing]] = await db.query(
    "SELECT email FROM users WHERE email = ? AND user_type IS NOT NULL",
    [email],
  );
  if (!existing) return { error: "User not found" };

  const g =
    gender != null && gender !== "" ? parseInt(String(gender), 10) : null;
  const e =
    ethnicity != null && ethnicity !== ""
      ? parseInt(String(ethnicity), 10)
      : null;

  if (password) {
    await db.query(
      `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, gender = ?, ethnicity = ?, password = ? WHERE email = ?`,
      [
        first_name,
        last_name,
        phone_number || null,
        Number.isNaN(g) ? null : g,
        Number.isNaN(e) ? null : e,
        password,
        email,
      ],
    );
  } else {
    await db.query(
      `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, gender = ?, ethnicity = ? WHERE email = ?`,
      [
        first_name,
        last_name,
        phone_number || null,
        Number.isNaN(g) ? null : g,
        Number.isNaN(e) ? null : e,
        email,
      ],
    );
  }

  return { success: true, message: "Profile updated", email };
}

export async function getAllUsers(db) {
  return await UserModel.findAll(db);
}

export async function createUser(db, data) {
  const {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
  } = data;

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
