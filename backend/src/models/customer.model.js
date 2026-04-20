export async function findAll(db, status = "active") {
  let whereClause = "";
  if (status === "active") {
    whereClause = "WHERE c.is_active = TRUE";
  } else if (status === "inactive") {
    whereClause = "WHERE c.is_active = FALSE";
  }

  const [rows] = await db.query(`
    SELECT c.*, u.first_name, u.last_name, u.email as user_email,
           u.phone_number,
           g.gender AS gender_name, r.race AS ethnicity_name
    FROM customers c
    LEFT JOIN users u ON c.email = u.email
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
    ${whereClause}
    ORDER BY u.last_name, u.first_name
  `);
  return rows;
}

export async function findByEmail(db, email) {
  const [[row]] = await db.query(
    `SELECT c.email, c.is_active
     FROM customers c
     WHERE c.email = ?`,
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
    `INSERT INTO customers 
     (email, default_address)
     VALUES (?, ?)`,
    [
      data.email,
      data.default_address || null,
    ]
  );
  return result;
}

export async function remove(db, email) {
  await db.query(
    `UPDATE customers SET is_active = FALSE WHERE email = ?`,
    [email]
  );
}

export async function reactivate(db, email) {
  const [result] = await db.query(
    "UPDATE customers SET is_active = TRUE WHERE email = ?",
    [email]
  );
  return result;
}

// export async function removeUser(db, email) {
//   await db.query("DELETE FROM users WHERE email = ?", [email]);
// }