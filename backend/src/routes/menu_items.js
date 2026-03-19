export async function getMenuItems(db) {
  const [rows] = await db.query(`
    SELECT m.*, c.category_name
    FROM menu_items m
    LEFT JOIN menu_category_lookup c ON m.category = c.category_id
    ORDER BY m.item_name
  `);
  return JSON.stringify(rows);
}

export async function createMenuItem(body, db) {
  const { item_name, category, description, price, image_url } = body;

  if (!item_name || !price) {
    return JSON.stringify({
      error: "Missing required fields: item_name, price",
    });
  }

  const [result] = await db.query(
    `INSERT INTO menu_items 
     (item_name, category, description, price, image_url)
     VALUES (?, ?, ?, ?, ?)`,
    [
      item_name,
      category || null,
      description || null,
      parseFloat(price),
      image_url || null,
    ]
  );

  return JSON.stringify({
    success: true,
    menu_item_id: result.insertId,
    message: "Menu item created successfully",
  });
}

export async function deleteMenuItem(body, db) {
  const { menu_item_id } = body;

  if (!menu_item_id) {
    return JSON.stringify({ error: "menu_item_id is required" });
  }

  const [result] = await db.query(
    "DELETE FROM menu_items WHERE menu_item_id = ?",
    [menu_item_id]
  );

  if (result.affectedRows === 0) {
    return JSON.stringify({ error: "Menu item not found" });
  }

  return JSON.stringify({
    success: true,
    message: "Menu item deleted successfully",
  });
}
