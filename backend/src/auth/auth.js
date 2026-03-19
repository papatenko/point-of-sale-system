import { mySQLQuery } from "../mysql.js";

// --- Login function ---
export async function login(email, password) {
  const users = await mySQLQuery("/api/users", []);

  // 🔥 buscar por email 
  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error("User not found");
  }

  // 🔥 comparar directo (porque NO usas bcrypt)
  if (user.password !== password) {
    throw new Error("Incorrect password");
  }

  // 🔥 verificar tipo (opcional pero recomendable)
  if (user.user_type !== "employee") {
    throw new Error("Not authorized");
  }

  return {
    user: {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type
    }
  };
}

// --- Register function ---
export async function register(email, password) {
  const users = await mySQLQuery("/api/users", []);

  if (users.find(u => u.email === email)) {
    throw new Error("User already exists");
  }

  // 🔥 guardar password directo (como tu DB actual)
  await mySQLQuery("/api/register-user", [email, password]);

  return { message: "User created successfully" };
}