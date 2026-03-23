import mysql from "mysql2/promise";

let pool = null;

export async function getDatabase() {
  if (!pool) {
    const missing = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
      (k) => !process.env[k],
    );
    if (missing.length > 0) {
      throw new Error(`Missing env vars: ${missing.join(", ")}`);
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}
