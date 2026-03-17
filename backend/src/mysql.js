import mysql from "mysql2/promise";

const DATABASE_HOST = process.env.DB_HOST;
const DATABASE_USER = process.env.DB_USER;
const DATABASE_PASSWORD = process.env.DB_PASSWORD;
const DATABASE_NAME = process.env.DB_NAME;

const database = await mysql.createConnection({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
});

export async function mySQLQuery(url) {
  if (url === "/api/employee") {
    return "HI FROM MYSQL";
  } else if (url === "/api/employee/pos") {
    database.query();
  } else if (url === "/api/employee/reports") {
    database.query();
  } else if (url === "/api/employee/inventory") {
    database.query();
  } else if (url === "/api/employee/creation") {
    database.query();
  } else if (url === "/api/employee/jsearch") {
    database.query();
  } else {
    return "";
  }
}

// Test connection
try {
  const [results] = await database.query("SELECT 1 + 1 AS solution");
  console.log("Connected!", results);
} catch (err) {
  console.error("Connection failed:", err);
}
