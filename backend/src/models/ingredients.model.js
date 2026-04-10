export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT i.*, s.supplier_name as preferred_supplier_name
    FROM ingredients i
    LEFT JOIN suppliers s ON i.preferred_supplier_id = s.supplier_id
    ORDER BY i.ingredient_name
  `);
  return rows;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO ingredients 
     (ingredient_name, category, unit_of_measure, current_unit_cost, storage_time, preferred_supplier_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.ingredient_name,
      data.category || null,
      data.unit_of_measure,
      parseFloat(data.current_unit_cost),
      data.storage_time ? parseInt(data.storage_time) : null,
      data.preferred_supplier_id || null,
    ]
  );
  return result;
}

export async function remove(db, ingredientId) {
  const [result] = await db.query(
    "DELETE FROM ingredients WHERE ingredient_id = ?",
    [ingredientId]
  );
  return result;
}

export async function update(db, data) {
  const [result] = await db.query(
    `UPDATE ingredients 
     SET ingredient_name = ?, category = ?, unit_of_measure = ?, current_unit_cost = ?, storage_time = ?, preferred_supplier_id = ?
     WHERE ingredient_id = ?`,
    [
      data.ingredient_name,
      data.category || null,
      data.unit_of_measure,
      parseFloat(data.current_unit_cost),
      data.storage_time ? parseInt(data.storage_time) : null,
      data.preferred_supplier_id || null,
      data.ingredient_id
    ]
  );
  return result;
}
