export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT 
      u.email,
      u.first_name,
      u.last_name,
      u.password,
      u.phone_number,
      u.user_type,
      g.gender AS gender_name,
      r.race AS race_name
    FROM users u
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
    ORDER BY u.last_name, u.first_name
  `);
  return rows;
}

export async function findByEmail(db, email) {
  const [[row]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
  );
  return row;
}

export async function update(db, email, data) {
  await db.query(
    `UPDATE users SET
     first_name = COALESCE(?, first_name),
     last_name = COALESCE(?, last_name),
     password = COALESCE(?, password),
     phone_number = ?,
     gender = ?,
     ethnicity = ?
     WHERE email = ?`,
    [
      data.first_name,
      data.last_name,
      data.password,
      data.phone_number || null,
      data.gender ? parseInt(data.gender) : null,
      data.ethnicity ? parseInt(data.ethnicity) : null,
      email,
    ],
  );
}

export async function remove(db, email) {
  await db.query("DELETE FROM users WHERE email = ?", [email]);
}

export async function findAllGenders(db) {
  const [rows] = await db.query(`
    SELECT gender_id, gender FROM gender_lookup ORDER BY gender
  `);
  return rows;
}

export async function findAllEthnicities(db) {
  const [rows] = await db.query(`
    SELECT race_id, race FROM race_lookup ORDER BY race
  `);
  return rows;
}
