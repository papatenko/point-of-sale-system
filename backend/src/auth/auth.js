import bcrypt from "bcrypt";
import { getDatabase } from "../database.js";
import { signUserToken, verifyToken } from "./jwt.js";

// --- Login function ---
export async function login(email, password) {
  const db = await getDatabase();

  const [rows] = await db.query(
    `SELECT u.email, u.password, u.first_name, u.user_type, e.role, e.license_plate
     FROM users u
     LEFT JOIN employees e ON u.email = e.email
     WHERE u.email = ?`,
    [email],
  );

  const user = rows[0];

  if (!user) throw new Error("User not found");

  // sin bcrypt (temporal)
  if (password !== user.password) {
    throw new Error("Incorrect password");
  }

  const token = signUserToken(user.email, user.user_type, user.role ?? null, user.license_plate ?? null);

  return {
    token,
    user: {
      email: user.email,
      first_name: user.first_name,
      user_type: user.user_type,
      role: user.role ?? null,
      license_plate: user.license_plate ?? null,
    },
  };
}

// --- Register function ---
export async function register(email, password, first_name, last_name) {
  const db = await getDatabase();

  const [users] = await db.query("SELECT email FROM users WHERE email = ?", [
    email,
  ]);
  if (users.length > 0) throw new Error("User already exists");

  await db.query(
    "INSERT INTO users (email, password, first_name, last_name, user_type) VALUES (?, ?, ?, ?, 'customer')",
    [email, password, first_name, last_name],
  );

  return { message: "User created successfully" };
}

export { verifyToken, signEmployeeToken } from "./jwt.js";

// verify manager role
export function verifyManager(token) {
  try {
    const payload = verifyToken(token);
    if (!payload) throw new Error("Invalid token");
    if (payload.role !== "manager") throw new Error("Not authorized");
    return payload;
  } catch (err) {
    throw new Error("Invalid token or unauthorized");
  }
}
