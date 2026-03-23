export async function findAll(db) {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.email,
        c.default_address,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.user_type,
        g.gender as gender_name,
        r.race as race_name
      FROM customers c
      JOIN users u ON c.email = u.email
      LEFT JOIN gender_lookup g ON u.gender = g.gender_id
      LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
      ORDER BY u.last_name, u.first_name
    `);
    console.log("Customers found:", rows.length);
    return rows;
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

export async function findByEmail(db, email) {
  try {
    const [[row]] = await db.query(
      `
      SELECT 
        c.email,
        c.default_address,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.user_type,
        g.gender as gender_name,
        r.race as race_name
      FROM customers c
      JOIN users u ON c.email = u.email
      LEFT JOIN gender_lookup g ON u.gender = g.gender_id
      LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
      WHERE c.email = ?
      `,
      [email]
    );
    return row;
  } catch (error) {
    console.error("Error in findByEmail:", error);
    throw error;
  }
}

export async function create(db, data) {
  try {
    const [result] = await db.query(
      `INSERT INTO customers (email, default_address)
       VALUES (?, ?)`,
      [
        data.email,
        data.default_address || null
      ]
    );
    return result;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

export async function remove(db, email) {
  try {
    await db.query("DELETE FROM customers WHERE email = ?", [email]);
  } catch (error) {
    console.error("Error in remove:", error);
    throw error;
  }
}

export async function removeUser(db, email) {
  try {
    await db.query("DELETE FROM users WHERE email = ?", [email]);
  } catch (error) {
    console.error("Error in removeUser:", error);
    throw error;
  }
}