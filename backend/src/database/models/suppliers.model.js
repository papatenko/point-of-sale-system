export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT * FROM suppliers ORDER BY supplier_name
  `);
  return rows;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO suppliers 
     (supplier_name, contact_person, email, phone_number, address)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.supplier_name,
      data.contact_person || null,
      data.email || null,
      data.phone_number || null,
      data.address || null,
    ]
  );
  return result;
}

export async function remove(db, supplierId) {
  const [result] = await db.query(
    "DELETE FROM suppliers WHERE supplier_id = ?",
    [supplierId]
  );
  return result;
}
