export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT c.*, u.first_name, u.last_name, u.email, u.phone_number
    FROM customers c
    JOIN users u ON c.email = u.email
    ORDER BY u.last_name, u.first_name
  `);
  return rows;
}

export async function findByEmail(db, email) {
  const [[row]] = await db.query(
    `SELECT c.*, u.first_name, u.last_name, u.email
     FROM customers c
     JOIN users u ON c.email = u.email
     WHERE c.email = ?`,
    [email]
  );
  return row;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO customers (email, default_address)
     VALUES (?, ?)`,
    [
      data.email,
      data.default_address || null
    ]
  );
  return result;
}

export async function remove(db, email) {
  await db.query("DELETE FROM customers WHERE email = ?", [email]);
}

export async function removeUser(db, email) {
  await db.query("DELETE FROM users WHERE email = ?", [email]);
}