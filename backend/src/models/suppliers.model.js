export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT * FROM suppliers ORDER BY supplier_name
  `);
  return rows;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO suppliers 
     (supplier_name, contact_person, email, phone_number, address, is_reliable_supplier)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.supplier_name,
      data.contact_person || null,
      data.email || null,
      data.phone_number || null,
      data.address || null,
      data.is_reliable_supplier !== undefined ? data.is_reliable_supplier : true,
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

export async function update(db, supplierId, data) {
  const fields = [];
  const values = [];

  if (data.supplier_name !== undefined) {
    fields.push("supplier_name = COALESCE(?, supplier_name)");
    values.push(data.supplier_name);
  }
  if (data.contact_person !== undefined) {
    fields.push("contact_person = ?");
    values.push(data.contact_person);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.phone_number !== undefined) {
    fields.push("phone_number = ?");
    values.push(data.phone_number);
  }
  if (data.address !== undefined) {
    fields.push("address = ?");
    values.push(data.address);
  }
  if (data.is_reliable_supplier !== undefined) {
    fields.push("is_reliable_supplier = ?");
    values.push(data.is_reliable_supplier ? 1 : 0);
  }

  if (fields.length === 0) return { affectedRows: 0 };

  values.push(supplierId);
  const [result] = await db.query(
    `UPDATE suppliers SET ${fields.join(", ")} WHERE supplier_id = ?`,
    values,
  );
  return result;
}
