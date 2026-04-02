export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT e.*, u.first_name, u.last_name, u.email as user_email
    FROM employees e
    JOIN users u ON e.email = u.email
    ORDER BY u.last_name, u.first_name
  `);
  return rows;
}

export async function findByEmail(db, email) {
  const [[row]] = await db.query(
    "SELECT email FROM employees WHERE email = ?",
    [email]
  );
  return row;
}

export async function emailExistsAsUser(db, email) {
  const [[row]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email]
  );
  return row;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO employees 
     (email, license_plate, role, hire_date)
     VALUES (?, ?, ?, ?)`,
    [
      data.email,
      data.license_plate,
      data.role || "cashier",
      data.hire_date || new Date().toISOString().split("T")[0],
    ]
  );
  return result;
}

export async function createManager(db, email) {
  const [result] = await db.query(
    "INSERT INTO managers (email, budget) VALUES (?, ?)",
    [email, 0.0]
  );
  return result;
}

export async function remove(db, email) {
  await db.query("DELETE FROM employees WHERE email = ?", [email]);
}

export async function removeUser(db, email) {
  await db.query("DELETE FROM users WHERE email = ?", [email]);
}
