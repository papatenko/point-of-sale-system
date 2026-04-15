export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT c.*, u.first_name, u.last_name, u.email as user_email,
           g.gender AS gender_name, r.race AS ethnicity_name
    FROM customers c
    JOIN users u ON c.email = u.email
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
    WHERE u.user_type IS NOT NULL
    ORDER BY u.last_name, u.first_name
  `);
  return rows;
}

export async function findByEmail(db, email) {
  const [[row]] = await db.query(
   `SELECT c.email
     FROM customers c
     JOIN users u ON c.email = u.email
     WHERE c.email = ?
     AND u.user_type IS NOT NULL`,
    [email]
  );
  return row;
}

export async function emailExistsAsUser(db, email) {
  const [[row]] = await db.query(
    "SELECT email FROM users WHERE email = ? AND user_type IS NOT NULL",
    [email]
  );
  return row;
}

// export async function create(db, data) {
//   const [result] = await db.query(
//     `INSERT INTO customers 
//      (email, default_address)
//      VALUES (?, ?)`,
//     [
//       data.email,
//       data.default_address || null,
//     ]
//   );
//   return result;
// }


export async function create(db, data) {
  // Usamos INSERT ... ON DUPLICATE KEY UPDATE para la tabla customers
  // Esto evita el error si el email ya estaba en la tabla de clientes
  const [result] = await db.query(
    `INSERT INTO customers (email, default_address)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE default_address = VALUES(default_address)`,
    [data.email, data.default_address || null]
  );

  // Forzamos la reactivación en la tabla users
  await db.query(
    "UPDATE users SET user_type = 'customer' WHERE email = ?",
    [data.email]
  );

  return result;
}

export async function remove(db, email) {
  await db.query(
    `UPDATE users 
     SET user_type = NULL 
     WHERE email = ?`,
      [email]);
}

// export async function removeUser(db, email) {
//   await db.query("DELETE FROM users WHERE email = ?", [email]);
// }