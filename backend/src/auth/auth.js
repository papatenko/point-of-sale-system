import { getDatabase } from "../database.js";
import { signUserToken } from "./jwt.js";

// --- Login function ---
export async function login(email, password) {
  const db = await getDatabase();

  const [rows] = await db.query(
    `SELECT u.email, u.password, u.first_name, u.user_type, e.role, e.license_plate, e.is_active
     FROM users u
     LEFT JOIN employees e ON u.email = e.email
     WHERE u.email = ?
     AND u.user_type IS NOT NULL`,
    [email],
  );

  const user = rows[0];

  if (!user) throw new Error("User not found");

  // sin bcrypt (temporal)
  if (password !== user.password) {
    throw new Error("Incorrect password");
  }

  if (user.user_type === "employee" && user.is_active === 0) {
    throw new Error("Invalid email or password");
  }

  const token = signUserToken(
    user.email,
    user.user_type,
    user.role ?? null,
    user.license_plate ?? null,
  );

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
// export async function register(
//   email,
//   password,
//   first_name,
//   last_name,
//   phone_number,
// ) {
//   const db = await getDatabase();

//   const [users] = await db.query("SELECT email FROM users WHERE email = ?", [
//     email,
//   ]);
//   if (users.length > 0) throw new Error("User already exists");

//   await db.query(
//     "INSERT INTO users (email, password, first_name, last_name, phone_number, user_type) VALUES (?, ?, ?, ?, ?, 'customer')",
//     [email, password, first_name, last_name, phone_number],
//   );

//   return { message: "User created successfully" };
// }

// --- Register function ---
export async function register(
  email,
  password,
  first_name,
  last_name,
  phone_number,
) {
  const db = await getDatabase();

  // 1. Buscamos si el usuario existe físicamente (aunque sea NULL)
  const [[existing]] = await db.query(
    "SELECT email, user_type FROM users WHERE email = ?", 
    [email]
  );

  if (existing) {
    // Caso A: El usuario está "borrado" (user_type IS NULL) -> Lo reactivamos
    if (existing.user_type === null) {
      await db.query(
        `UPDATE users SET 
          password = ?, first_name = ?, last_name = ?, phone_number = ?, user_type = 'customer'
         WHERE email = ?`,
        [password, first_name, last_name, phone_number, email]
      );
      return { message: "Account reactivated successfully" };
    }

    // Caso B: El usuario existe y está activo
    throw new Error("User already exists");
  }

  // 2. Si no existe en absoluto, lo creamos de cero
  await db.query(
    "INSERT INTO users (email, password, first_name, last_name, phone_number, user_type) VALUES (?, ?, ?, ?, ?, 'customer')",
    [email, password, first_name, last_name, phone_number],
  );

  return { message: "User created successfully" };
}

export { verifyToken, signEmployeeToken } from "./jwt.js";
