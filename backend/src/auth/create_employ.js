// import express from "express"; // import bcrypt from "bcrypt";
// import { verifyManager, sendNotification } from "./auth/auth.js";
// import { mySQLQuery } from "./mysql.js";

// const app = express();
// app.use(express.json());

// app.post("/api/employee/create", async (req, res) => {
//   try {
//     console.log("Creating employee with data:", req.body);

//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "No token provided" });
//     }

//     // Verificar que es manager
//     verifyManager(token);

//     const { adminPassword, employeeData } = req.body;

//     // Verificar password de admin
//     if (adminPassword !== "Spiderman") {
//       return res.status(403).json({ error: "Invalid admin password" });
//     }

//     const {
//       email,
//       first_name,
//       last_name,
//       password,
//       phone_number,
//       role,
//       gender,
//       ethnicity,
//       license_plate,
//       hire_date,
//       hourly_rate
//     } = employeeData;

//     // Validar datos requeridos
//     if (!email || !first_name || !last_name || !password) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Hash de la contraseña
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 1. Insertar en users table
//     console.log("Inserting into users...");
//     const userResult = await mySQLQuery("/api/register-user", [
//       email,
//       first_name,
//       last_name,
//       hashedPassword,
//       phone_number || null,
//       role || 'employee',
//       gender || 1,
//       ethnicity || 1
//     ]);
//     console.log("User created:", userResult);

//     // 2. Insertar en employees table
//     console.log("Inserting into employees...");
//     const employeeResult = await mySQLQuery("/api/employee/creation", [
//       email,
//       license_plate || null,
//       role || 'employee',
//       hire_date || null,
//       hourly_rate || null
//     ]);
//     console.log("Employee created:", employeeResult);

//     // 3. Si es manager, insertar en managers table
//     if (role === "manager") {
//       console.log("Inserting into managers...");
//       const managerResult = await mySQLQuery("/api/register-manager", [email, 0.0]);
//       console.log("Manager created:", managerResult);
//     }

//     // 4. Enviar notificación
//     // try {
//     //   sendNotification("+3465260235", `Employee account for ${first_name} ${last_name} created.`);
//     // } catch (notifyError) {
//     //   console.error("Notification error:", notifyError);
//     //   No fallar la petición si la notificación falla
//     // }

//     // 5. Responder con éxito
//     res.status(200).json({
//       success: true,
//       message: "Employee created successfully",
//       employeeId: userResult.insertId || employeeResult.insertId,
//       employee: {
//         email,
//         first_name,
//         last_name,
//         role
//       }
//     });

//   } catch (err) {
//     console.error("Error creating employee:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message || "Internal server error"
//     });
//   }
// });

// export default app;

// auth/create-employee.js
import { employeeCreateQuery } from "../mysql.js";

export async function handleEmployeeCreate(req, res, body) {
  try {
    console.log("Creating employee with data:", body);

    // Verificar token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No token provided" }));
      return;
    }

    // Aquí puedes verificar el token con tu función verifyManager
    // verifyManager(token);

    const { adminPassword, employeeData } = body;

    // Verificar password de admin
    if (adminPassword !== "Spiderman") {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid admin password" }));
      return;
    }

    const {
      email,
      first_name,
      last_name,
      password,
      phone_number,
      role: user_type,
      gender,
      ethnicity,
      license_plate,
      hire_date,
      hourly_rate,
    } = employeeData;

    // Validar datos requeridos
    if (!email || !first_name || !last_name || !password) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required fields" }));
      return;
    }

    // 1. Insertar en users table
    console.log("Inserting into users...");
    const userResult = await employeeCreateQuery("/api/register-user", [
      email,
      first_name,
      last_name,
      password,
      phone_number || null,
      "employee",
      gender || 1,
      ethnicity || 1,
    ]);
    console.log("User created:", userResult);

    // 2. Insertar en employees table
    console.log("Inserting into employees...");

    // Verificar que license_plate existe en food_trucks o usar uno por defecto
    let finalLicensePlate = license_plate;
    if (!finalLicensePlate) {
      // Buscar un food truck por defecto
      const trucks = await employeeCreateQuery("/api/food-trucks", []);
      finalLicensePlate = trucks[0]?.license_plate || "ABC-123";
    }

    const employeeResult = await employeeCreateQuery("/api/employee/create", [
      email,
      finalLicensePlate,
      user_type || "cashier",
      hire_date || new Date().toISOString().split("T")[0],
      hourly_rate || 15.0,
    ]);
    console.log("Employee created:", employeeResult);

    // 3. Si es manager, insertar en managers table
    if (user_type === "manager") {
      console.log("Inserting into managers...");
      const managerResult = await employeeCreateQuery("/api/register-manager", [
        email,
        0.0,
      ]);
      console.log("Manager created:", managerResult);
    }

    // 4. Responder con éxito
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: "Employee created successfully",
        employeeId: userResult.insertId || employeeResult.insertId,
        employee: {
          email,
          first_name,
          last_name,
          role: user_type,
        },
      }),
    );
    return;
  } catch (err) {
    console.error("Error creating employee:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: err.message || "Internal server error",
      }),
    );
    return;
  }
}
