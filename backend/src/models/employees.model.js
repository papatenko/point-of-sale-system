export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT e.*, u.first_name, u.last_name, u.email as user_email,
           u.phone_number, u.gender, u.ethnicity,
           g.gender AS gender_name, r.race AS ethnicity_name
    FROM employees e
    JOIN users u ON e.email = u.email
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
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

export async function update(db, email, data) {
  const fields = [];
  const values = [];

  if (data.role !== undefined) {
    fields.push("role = ?");
    values.push(data.role);
  }
  if (data.license_plate !== undefined) {
    fields.push("license_plate = ?");
    values.push(data.license_plate || null);
  }
  if (data.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(data.is_active === "1" ? 1 : 0);
  }

  if (fields.length === 0) return;

  values.push(email);
  await db.query(
    `UPDATE employees SET ${fields.join(", ")} WHERE email = ?`,
    values,
  );
}
