export async function getSuppliers(db) {
  const [rows] = await db.query(`
    SELECT * FROM suppliers
    ORDER BY supplier_name
  `);
  // Return raw rows; the HTTP server will JSON.stringify once.
  return rows;
}

export async function createSupplier(body, db) {
  const { supplier_name, contact_person, email, phone_number, address } = body;

  if (!supplier_name) {
    return {
      error: "Missing required field: supplier_name",
    };
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

  return {
    success: true,
    supplier_id: result.insertId,
    message: "Supplier created successfully",
  };
}

export async function deleteSupplier(body, db) {
  const { supplier_id } = body;

  if (!supplier_id) {
    return { error: "supplier_id is required" };
  }

  const [result] = await db.query(
    "DELETE FROM suppliers WHERE supplier_id = ?",
    [supplier_id]
  );

  if (result.affectedRows === 0) {
    return { error: "Supplier not found" };
  }

  return {
    success: true,
    message: "Supplier deleted successfully",
  };
}
