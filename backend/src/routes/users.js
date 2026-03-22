export async function getUsers(db) {
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

export async function updateUser(body, db) {
  const {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
  } = body;

  if (!email) {
    return { error: "email is required" };
  }

  const [[existing]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
  );

  if (!existing) {
    return { error: "User not found" };
  }

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
      first_name,
      last_name,
      password,
      phone_number || null,
      gender ? parseInt(gender) : null,
      ethnicity ? parseInt(ethnicity) : null,
      email,
    ],
  );

  return {
    success: true,
    message: "User updated successfully",
  };
}

export async function deleteUser(body, db) {
  const { email } = body;

  if (!email) {
    return { error: "email is required" };
  }

  const [[existing]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
  );

  if (!existing) {
    return { error: "User not found" };
  }

  await db.query("DELETE FROM users WHERE email = ?", [email]);

  return {
    success: true,
    message: "User deleted successfully",
  };
}

export async function getGenderOptions(db) {
  const [rows] = await db.query(`
    SELECT gender_id, gender FROM gender_lookup ORDER BY gender
  `);
  return rows;
}

export async function getEthnicityOptions(db) {
  const [rows] = await db.query(`
    SELECT race_id, race FROM race_lookup ORDER BY race
  `);
  return rows;
}
