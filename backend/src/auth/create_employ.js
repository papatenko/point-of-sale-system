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
    return;
  } catch (err) {
    console.error("Error creating employee:", err);
    return;
  }
}
