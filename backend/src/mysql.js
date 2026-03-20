import mysql from "mysql2/promise";
import { insertTransation } from "./routes/pos.js";
import "dotenv/config";

const DATABASE_HOST = process.env.DB_HOST;
const DATABASE_USER = process.env.DB_USER;
const DATABASE_PASSWORD = process.env.DB_PASSWORD;
const DATABASE_NAME = process.env.DB_NAME;

export const database = await mysql.createConnection({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
})

export async function mySQLQuery(url,  params = []) {
  // rebeca routes for auth XD
       if (url === "/api/users") {
    const [rows] = await database.query("SELECT * FROM users");
    return rows;
  } else if (url === "/api/auth/login") {
  console.log(" PARAMS:", params);
  console.log(" LENGTH:", params?.length);
  console.log(" TYPE:", typeof params);
  
  try {
    // Verificar que params existe y tiene al menos 2 elementos
    if (!Array.isArray(params) || params.length < 2) {
      return { success: false, error: "Invalid parameters, hello " };
    }
    
    const [rows] = await database.query(
      `SELECT u.*, e.role as employee_role, e.license_plate, e.hire_date, e.hourly_rate 
       FROM users u
       LEFT JOIN employees e ON u.email = e.email
       WHERE u.email = ? AND u.password = ? AND u.user_type = 'employee'`,
      [params[0], params[1]],
      console.log( [params[0], params[1]])
    );
    
    console.log("✅ Query ejecutada, rows:", rows);
    
    // Verificar que rows existe y tiene elementos
    if (rows && rows.length > 0) {
      const user = rows[0];
      const role = user.employee_role || 'employee';
      
      return {
        success: true,
        user: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type,
          role: role,
          license_plate: user.license_plate,
          hire_date: user.hire_date,
          hourly_rate: user.hourly_rate
        },
        token: JSON.stringify({ 
          email: user.email, 
          role: role,
          name: `${user.first_name} ${user.last_name}`
        })
      };
    } else {
      console.log("❌ No se encontró usuario con esas credenciales");
      return { 
        success: false, 
        error: "Invalid email or password" 
      };
    }
  } catch (error) {
    console.error("❌ Error en query de login:", error);
    return { 
      success: false, 
      error: "Database error: " + error.message 
    };
  }
}else if (url === "/api/food-trucks") {
    const [rows] = await database.query("SELECT license_plate, truck_name FROM food_trucks");
    return rows;
  }else if (url === "/api/register-user") {
  const [result] = await database.query(
    "INSERT INTO users(email, first_name, last_name, password, phone_number, user_type, gender, ethnicity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    params
  );
  return result;
} else if (url === "/api/register-customer") {
  const [result] = await database.query(
    "INSERT INTO customers(email, first_name, last_name, password, phone_number, gender, ethnicity) VALUES (?, ?, ?, ?, ?, ?, ?)",
    params
  );
  return result;
}else if (url === "/api/employee") {
  const [rows] = await database.query(
    `SELECT e.*, u.first_name, u.last_name, u.email 
     FROM employees e
     JOIN users u ON e.email = u.email
     WHERE u.user_type = 'employee'`
  );
  return rows;
}else if (url === "/api/register-manager") {
    const [result] = await database.query(
      `INSERT INTO managers(email, budget)
       VALUES (?, ?)`,
      params
    );
    return result;
  }else if (url === "/api/employee/create") {
    // Handle employee creation - insert into employees table
    const [result] = await database.query(
      `INSERT INTO employees 
       (email, license_plate, role, hire_date, hourly_rate) 
       VALUES (?, ?, ?, ?, ?)`,
      params
    );
    return result;
  }
  
  // Default return for unhandled routes
  return { insertId: null };
}


// Test connection
try {
  const [results] = await database.query("SELECT 1 + 1 AS solution");
  console.log("Connected!", results);
} catch (err) {
  console.error("Connection failed:", err);
}

