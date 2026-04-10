export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT m.*, c.category_name
    FROM menu_items m
    LEFT JOIN menu_category_lookup c ON m.category = c.category_id
    ORDER BY m.item_name
  `);
  return rows;
}

export async function findAllWithRecipes(db) {
  const [items] = await db.query(`
    SELECT m.*, c.category_name
    FROM menu_items m
    LEFT JOIN menu_category_lookup c ON m.category = c.category_id
    ORDER BY m.item_name
  `);

  const [recipes] = await db.query(`
    SELECT
      ri.recipe_id,
      ri.menu_item_id,
      ri.ingredient_id,
      i.ingredient_name,
      i.unit_of_measure,
      ri.quantity_needed,
      ri.instructions
    FROM recipe_ingredient ri
    JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
    ORDER BY ri.menu_item_id, i.ingredient_name
  `);

  const recipeMap = {};
  for (const r of recipes) {
    if (!recipeMap[r.menu_item_id]) {
      recipeMap[r.menu_item_id] = [];
    }
    recipeMap[r.menu_item_id].push({
      recipe_id: r.recipe_id,
      ingredient_id: r.ingredient_id,
      ingredient_name: r.ingredient_name,
      unit_of_measure: r.unit_of_measure,
      quantity_needed: r.quantity_needed,
      instructions: r.instructions,
    });
  }

  return items.map((item) => ({
    ...item,
    recipes: recipeMap[item.menu_item_id] || [],
  }));
}

export async function findAvailable(db) {
  const [rows] = await db.query(`
    SELECT m.*, c.category_name
    FROM menu_items m
    LEFT JOIN menu_category_lookup c ON m.category = c.category_id
    WHERE m.is_available = TRUE
    ORDER BY m.category, m.item_name
  `);
  return rows;
}

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO menu_items 
     (item_name, category, description, price, image_url)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.item_name,
      data.category || null,
      data.description || null,
      parseFloat(data.price),
      data.image_url || null,
    ]
  );
  return result;
}

export async function remove(db, menuItemId) {
  const [result] = await db.query(
    "DELETE FROM menu_items WHERE menu_item_id = ?",
    [menuItemId]
  );
  return result;
}

export async function findById(db, menuItemId) {
  const [[row]] = await db.query(
    "SELECT menu_item_id FROM menu_items WHERE menu_item_id = ?",
    [menuItemId]
  );
  return row;
}

export async function update(db, menuItemId, data) {
  const fields = [];
  const values = [];

  if (data.item_name !== undefined) {
    fields.push("item_name = ?");
    values.push(data.item_name);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    values.push(data.category || null);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description || null);
  }
  if (data.price !== undefined) {
    fields.push("price = ?");
    values.push(parseFloat(data.price));
  }
  if (data.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(data.image_url || null);
  }
  if (data.is_available !== undefined) {
    fields.push("is_available = ?");
    values.push(Boolean(data.is_available));
  }

  if (fields.length === 0) return;

  values.push(menuItemId);
  await db.query(
    `UPDATE menu_items SET ${fields.join(", ")} WHERE menu_item_id = ?`,
    values
  );
}
