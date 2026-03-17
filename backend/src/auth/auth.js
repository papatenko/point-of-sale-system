import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mySQLQuery } from "../mysql.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// --- Login function ---
export async function login(username, password) {
  const users = await mySQLQuery("/api/users");
  const user = users.find(u => u.username === username);

  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Incorrect password");

  // Generate JWT token including the role
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role }, // include role
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  return { token, user: { id: user.id, username: user.username, role: user.role } };
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