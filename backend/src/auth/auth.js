import bcrypt from "bcrypt";
import { getDatabase } from "../database.js";
import dotenv from "dotenv";
import { signEmployeeToken, verifyToken } from "./jwt.js";

dotenv.config();

// --- Login function ---
export async function login(email, password) {
  const db = await getDatabase();

  const [rows] = await db.query(
    `SELECT u.email, u.password
     FROM users u
     INNER JOIN employees e ON u.email = e.email
     WHERE u.email = ?`,
    [email]
  );

  const user = rows[0];

  if (!user) throw new Error("Employee not found");

  // sin bcrypt (temporal)
  if (password !== user.password) {
    throw new Error("Incorrect password");
  }

  const token = signEmployeeToken(user.email);

  return {
    token,
    user: {
      email: user.email
    }
  };
}

// --- Register function ---
export async function register(username, password) {
  const db = await getDatabase();

  const [users] = await db.query("SELECT email FROM users WHERE email = ?", [username]);
  if (users.length > 0) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)",
    [username, hashedPassword, username.split("@")[0], ""]
  );

  return { message: "User created successfully" };
}

export { verifyToken } from "./jwt.js";

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