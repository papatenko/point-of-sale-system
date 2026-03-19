export async function getSuppliers(db) {
  const [rows] = await db.query(`
    SELECT * FROM suppliers
    ORDER BY supplier_name
  `);
  return JSON.stringify(rows);
}

export async function createSupplier(body, db) {
  const { supplier_name, contact_person, email, phone_number, address } = body;

  if (!supplier_name) {
    return JSON.stringify({
      error: "Missing required field: supplier_name",
    });
  }

  const [result] = await db.query(
    `INSERT INTO suppliers 
     (supplier_name, contact_person, email, phone_number, address)
     VALUES (?, ?, ?, ?, ?)`,
    [
      supplier_name,
      contact_person || null,
      email || null,
      phone_number || null,
      address || null,
    ]
  );

  return JSON.stringify({
    success: true,
    supplier_id: result.insertId,
    message: "Supplier created successfully",
  });
}

export async function deleteSupplier(body, db) {
  const { supplier_id } = body;

  if (!supplier_id) {
    return JSON.stringify({ error: "supplier_id is required" });
  }

  const [result] = await db.query(
    "DELETE FROM suppliers WHERE supplier_id = ?",
    [supplier_id]
  );

  if (result.affectedRows === 0) {
    return JSON.stringify({ error: "Supplier not found" });
  }

  return JSON.stringify({
    success: true,
    message: "Supplier deleted successfully",
  });
}
