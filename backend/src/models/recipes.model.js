export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT 
      ri.recipe_id,
      ri.menu_item_id,
      ri.ingredient_id,
      mi.item_name AS menu_item_name,
      i.ingredient_name,
      i.unit_of_measure,
      ri.quantity_needed,
      ri.instructions
    FROM recipe_ingredient ri
    JOIN menu_items mi ON ri.menu_item_id = mi.menu_item_id
    JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
    ORDER BY mi.item_name, i.ingredient_name
  `);
  return rows;
}

export async function findByMenuItem(db, menuItemId) {
  const [rows] = await db.query(
    `SELECT 
      ri.recipe_id,
      ri.menu_item_id,
      ri.ingredient_id,
      i.ingredient_name,
      i.unit_of_measure,
      ri.quantity_needed,
      ri.instructions
    FROM recipe_ingredient ri
    JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
    WHERE ri.menu_item_id = ?
    ORDER BY i.ingredient_name`,
    [menuItemId]
  );
  return rows;
}

export async function findByMenuItemAndIngredient(db, menuItemId, ingredientId) {
  const [[row]] = await db.query(
    "SELECT recipe_id FROM recipe_ingredient WHERE menu_item_id = ? AND ingredient_id = ?",
    [menuItemId, ingredientId]
  );
  return row;
}

export async function findById(db, recipeId) {
  const [[row]] = await db.query(
    "SELECT recipe_id FROM recipe_ingredient WHERE recipe_id = ?",
    [recipeId]
  );
  return row;
}

export async function menuItemExists(db, menuItemId) {
  const [[row]] = await db.query(
    "SELECT menu_item_id FROM menu_items WHERE menu_item_id = ?",
    [menuItemId]
  );
  return row;
}

export async function ingredientExists(db, ingredientId) {
  const [[row]] = await db.query(
    "SELECT ingredient_id FROM ingredients WHERE ingredient_id = ?",
    [ingredientId]
  );
  return row;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO recipe_ingredient 
     (menu_item_id, ingredient_id, quantity_needed, instructions)
     VALUES (?, ?, ?, ?)`,
    [data.menu_item_id, data.ingredient_id, parseFloat(data.quantity_needed), data.instructions || null]
  );
  return result;
}

export async function update(db, recipeId, data) {
  await db.query(
    `UPDATE recipe_ingredient SET
     quantity_needed = COALESCE(?, quantity_needed),
     instructions = ?
     WHERE recipe_id = ?`,
    [data.quantity_needed ? parseFloat(data.quantity_needed) : null, data.instructions, recipeId]
  );
}

export async function remove(db, recipeId) {
  await db.query("DELETE FROM recipe_ingredient WHERE recipe_id = ?", [recipeId]);
}
