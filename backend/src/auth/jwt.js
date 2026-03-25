import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token) {
  if (!token || !JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Same shape as login: employee session token */
export function signEmployeeToken(email) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
}

/** Full user token including user_type and role */
export function signUserToken(email, user_type, role) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ email, user_type, role: role ?? null }, JWT_SECRET, {
    expiresIn: "2h",
  });
}
