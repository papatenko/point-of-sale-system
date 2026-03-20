import { mySQLQuery } from "../mysql.js";

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
        error: "Missing required fields: email, first_name, last_name, password" 
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

    // 1️⃣ Insertar en tabla users
    const userResult = await mySQLQuery("/api/register-user", [
      email,
      first_name,
      last_name,
      password,
      phone_number || null,
      "customer",
      gender || null,
      ethnicity || null
    ]);

    // 2️⃣ Insertar en tabla customers
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