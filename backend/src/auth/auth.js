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

export async function register(email, password, first_name = "", last_name = "") {
  const users = await mySQLQuery("/api/users", []);
  
  if (users.find(u => u.email === email)) {
    throw new Error("User already exists");
  }

  // Ahora también pasamos todos los 8 parámetros para mantener consistencia
  await mySQLQuery("/api/users/register-user", [
    email,
    first_name,
    last_name,
    password,
    null,        // phone_number
    "employee",  // user_type
    0,           // gender
    0            // ethnicity
  ]);

  return { message: "User created successfully" };
}

// --- Customer registration ---
export async function handleCustomerCreate(req, res, body) {
  try {
    const {
      email,
      first_name,
      last_name,
      password,
      phone_number,
      default_address,
      gender,
      ethnicity
    } = body;

    // Validar campos requeridos
    if (!email || !first_name || !last_name || !password) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        success: false, 
        error: "Missing required fields" 
      }));
      return;
    }

    // Verificar si el usuario ya existe
    const users = await mySQLQuery("/api/users", []);
    if (users.find(u => u.email === email)) {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        success: false, 
        error: "User already exists" 
      }));
      return;
    }

    // Insertar en users table con 8 parámetros
    const userResult = await mySQLQuery("/api/users/register-user", [
      email,
      first_name,
      last_name,
      password,
      phone_number || null,
      "customer",
      gender !== undefined ? gender : 0,
      ethnicity !== undefined ? ethnicity : 0
    ]);

    // Insertar en tabla customers
    const customerResult = await mySQLQuery("/api/register-customer", [
      email,
      default_address || null
    ]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      message: "Customer registered successfully",
      userId: userResult.insertId,
      customerId: customerResult.insertId
    }));
    
  } catch (err) {
    console.error("Error creating customer:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      success: false, 
      error: err.message || "Internal server error" 
    }));
  }
}