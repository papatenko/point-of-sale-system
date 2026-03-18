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
});

export async function mySQLQuery(url, params = []) {
  // rebeca routes for auth XD
  if (url === "/api/users") {
    const [rows] = await database.query("SELECT * FROM users");
    return rows;
  } else if (url === "/api/register-user") {
    const [result] = await database.query(
      "INSERT INTO users(email, first_name, last_name, password, phone_number, user_type, gender, ethnicity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params,
    );
    return result;
  } else if (url === "/api/register-manager") {
    const [result] = await database.query(
      `INSERT INTO managers(email, budget)
       VALUES (?, ?)`,
      params,
    );
    return result;
  } else if (url === "/api/employee/create") {
    // Handle employee creation - insert into employees table
    const [result] = await database.query(
      `INSERT INTO employees 
       (email, license_plate, role, hire_date, hourly_rate) 
       VALUES (?, ?, ?, ?, ?)`,
      params,
    );
    return result;
  }

  // Default return for unhandled routes
  return { insertId: null };
}

// export async function mySQLQuery(url, body = null, method = "GET") {
//   if (url === "/api/employee") {
//     return "HI FROM MYSQL";
//   } else if (url === "/api/employee/pos") {
//     if (method === "POST" && body) {
//       const result = await insertTransation(body);
//       console.log("Transaction result:", result);
//       return JSON.stringify(result);
//     }
//     const [menuItems] = await database.query(
//       "SELECT * FROM menu_items WHERE is_available = TRUE",
//     );
//     console.log("Fetching menu items:", menuItems.length);
//     return JSON.stringify(menuItems);
//   } else if (url === "/api/employee/reports") {
//     database.query();
//   } else if (url === "/api/employee/inventory") {
//     database.query();
//   }   else if (url === "/api/employee/creation") {
//       // CORREGIDO
//       return new Promise((resolve, reject) => {
//         const query = `INSERT INTO employees
//                        (email, license_plate, role, hire_date, hourly_rate)
//                        VALUES (?, ?, ?, ?, ?)`;

//         database.query(query, params, (err, result) => {
//           if (err) {
//             console.error("Error creating employee:", err);
//             reject(err);
//           } else {
//             console.log("Employee created with ID:", result.insertId);
//             resolve(result); // Esto devuelve { insertId, affectedRows, etc. }
//           }
//         });
//       });
//     }   else if (url === "/api/employee/jsearch") {
//     database.query();
//   } else if (url === "/api/auth/login") {
//     database.query();
//   }  else {
//     return "";
//   }
// }

// Test connection
try {
  const [results] = await database.query("SELECT 1 + 1 AS solution");
  console.log("Connected!", results);
} catch (err) {
  console.error("Connection failed:", err);
}
