export async function getRecipes(db) {
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

export async function getRecipesByMenuItem(menuItemId, db) {
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

export async function createRecipe(body, db) {
  const { menu_item_id, ingredient_id, quantity_needed, instructions } = body;

  if (!menu_item_id || !ingredient_id || !quantity_needed) {
    return {
      error: "Missing required fields: menu_item_id, ingredient_id, quantity_needed",
    };
  }

  const [[menuItem]] = await db.query(
    "SELECT menu_item_id FROM menu_items WHERE menu_item_id = ?",
    [menu_item_id]
  );
  if (!menuItem) {
    return { error: "Menu item not found" };
  }

  const [[ingredient]] = await db.query(
    "SELECT ingredient_id FROM ingredients WHERE ingredient_id = ?",
    [ingredient_id]
  );
  if (!ingredient) {
    return { error: "Ingredient not found" };
  }

  const [[existing]] = await db.query(
    "SELECT recipe_id FROM recipe_ingredient WHERE menu_item_id = ? AND ingredient_id = ?",
    [menu_item_id, ingredient_id]
  );
  if (existing) {
    return { error: "This ingredient is already in the recipe for this menu item" };
  }

  const [result] = await db.query(
    `INSERT INTO recipe_ingredient 
     (menu_item_id, ingredient_id, quantity_needed, instructions)
     VALUES (?, ?, ?, ?)`,
    [menu_item_id, ingredient_id, parseFloat(quantity_needed), instructions || null]
  );

  return {
    success: true,
    recipe_id: result.insertId,
    message: "Recipe ingredient added successfully",
  };
}

export async function updateRecipe(body, db) {
  const { recipe_id, quantity_needed, instructions } = body;

  if (!recipe_id) {
    return { error: "recipe_id is required" };
  }

  const [[existing]] = await db.query(
    "SELECT recipe_id FROM recipe_ingredient WHERE recipe_id = ?",
    [recipe_id]
  );
  if (!existing) {
    return { error: "Recipe not found" };
  }

  await db.query(
    `UPDATE recipe_ingredient SET
     quantity_needed = COALESCE(?, quantity_needed),
     instructions = ?
     WHERE recipe_id = ?`,
    [quantity_needed ? parseFloat(quantity_needed) : null, instructions, recipe_id]
  );

  return {
    success: true,
    message: "Recipe updated successfully",
  };
}

export async function deleteRecipe(body, db) {
  const { recipe_id } = body;

  if (!recipe_id) {
    return { error: "recipe_id is required" };
  }

  const [[existing]] = await db.query(
    "SELECT recipe_id FROM recipe_ingredient WHERE recipe_id = ?",
    [recipe_id]
  );
  if (!existing) {
    return { error: "Recipe not found" };
  }

  await db.query("DELETE FROM recipe_ingredient WHERE recipe_id = ?", [recipe_id]);

  return {
    success: true,
    message: "Recipe ingredient removed successfully",
  };
}
