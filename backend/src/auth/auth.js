import { getDatabase } from "../database.js";
import { signUserToken } from "./jwt.js";

// --- Login function ---
export async function login(email, password) {
  const db = await getDatabase();

  const [rows] = await db.query(
    `SELECT u.email, u.password, u.first_name, u.user_type, e.role, e.license_plate, e.is_active AS employee_is_active, c.is_active AS customer_is_active
     FROM users u
     LEFT JOIN employees e ON u.email = e.email
     LEFT JOIN customers c ON u.email = c.email
     WHERE u.email = ?  
    AND u.user_type IS NOT NULL `,
    [email],
  );

  const user = rows[0];

  if (!user) throw new Error("User not found");

  // sin bcrypt (temporal)
  if (password !== user.password) {
    throw new Error("Incorrect password");
  }

  if (user.user_type === "employee" && user.employee_is_active === 0) {
    throw new Error("This account has been deactivated. Please contact an administrator.");
  }

  if (user.user_type === "customer" && user.customer_is_active === 0) {
    throw new Error("This account has been deactivated. Please contact an administrator.");
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

export async function register(
  email,
  password,
  first_name,
  last_name,
  phone_number,
) {
  const db = await getDatabase();

  // 1. Verificar si existe
  const [users] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email]
  );
  if (users.length > 0) throw new Error("User already exists");

  // 2. Insertar en users
  const [result] = await db.query(
    `INSERT INTO users 
    (email, password, first_name, last_name, phone_number, user_type) 
    VALUES (?, ?, ?, ?, ?, 'customer')`,
    [email, password, first_name, last_name, phone_number]
  );

  // 🔥 3. Insertar en customers
  await db.query(
    "INSERT INTO customers (email) VALUES (?)",
    [email]
  );

  return { message: "User created successfully" };
}

export { verifyToken, signEmployeeToken } from "./jwt.js";
