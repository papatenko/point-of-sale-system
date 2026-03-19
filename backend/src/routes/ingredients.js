export async function getIngredients(db) {
  const [rows] = await db.query(`
    SELECT i.*, s.supplier_name as preferred_supplier_name
    FROM ingredients i
    LEFT JOIN suppliers s ON i.preferred_supplier_id = s.supplier_id
    ORDER BY i.ingredient_name
  `);
  return JSON.stringify(rows);
}

export async function createIngredient(body, db) {
  const {
    ingredient_name,
    category,
    unit_of_measure,
    current_unit_cost,
    storage_time,
    preferred_supplier_id,
  } = body;

  if (!ingredient_name || !unit_of_measure || !current_unit_cost) {
    return JSON.stringify({
      error: "Missing required fields: ingredient_name, unit_of_measure, current_unit_cost",
    });
  }

  const validUnits = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "pcs"];
  if (!validUnits.includes(unit_of_measure)) {
    return JSON.stringify({
      error: `Invalid unit_of_measure. Must be one of: ${validUnits.join(", ")}`,
    });
  }

  const [result] = await db.query(
    `INSERT INTO ingredients 
     (ingredient_name, category, unit_of_measure, current_unit_cost, storage_time, preferred_supplier_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ingredient_name,
      category || null,
      unit_of_measure,
      parseFloat(current_unit_cost),
      storage_time ? parseInt(storage_time) : null,
      preferred_supplier_id || null,
    ]
  );

  return JSON.stringify({
    success: true,
    ingredient_id: result.insertId,
    message: "Ingredient created successfully",
  });
}

export async function deleteIngredient(body, db) {
  const { ingredient_id } = body;

  if (!ingredient_id) {
    return JSON.stringify({ error: "ingredient_id is required" });
  }

  const [result] = await db.query(
    "DELETE FROM ingredients WHERE ingredient_id = ?",
    [ingredient_id]
  );

  if (result.affectedRows === 0) {
    return JSON.stringify({ error: "Ingredient not found" });
  }

  return JSON.stringify({
    success: true,
    message: "Ingredient deleted successfully",
  });
}
