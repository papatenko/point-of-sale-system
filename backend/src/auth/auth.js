import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mySQLQuery, getDatabase } from "../mysql.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

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

  const token = jwt.sign(
    { email: user.email },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  return {
    token,
    user: {
      email: user.email
    }
  };
}

// --- Register function ---
export async function register(username, password) {
  const users = await mySQLQuery("/api/users");
  if (users.find(u => u.username === username)) throw new Error("User already exists");

  // Hash password before storing
  const hashedPassword = await bcrypt.hash(password, 10);
  await mySQLQuery("/api/register-user", [username, hashedPassword]);

  return { message: "User created successfully" };
}

// --- Verify JWT token ---
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// verify manager role
export function verifyManager(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "manager") throw new Error("Not authorized");
    return payload;
  } catch (err) {
    throw new Error("Invalid token or unauthorized");
  }
}