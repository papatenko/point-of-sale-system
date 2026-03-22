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

export async function remove(db, email) {
  await db.query("DELETE FROM employees WHERE email = ?", [email]);
}

export async function removeUser(db, email) {
  await db.query("DELETE FROM users WHERE email = ?", [email]);
}
