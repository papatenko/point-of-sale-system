export async function getMenuItems(db) {
  const [rows] = await db.query(`
    SELECT m.*, c.category_name
    FROM menu_items m
    LEFT JOIN menu_category_lookup c ON m.category = c.category_id
    ORDER BY m.item_name
  `);
  // Return raw rows; the HTTP server will JSON.stringify once.
  return rows;
}

export async function createMenuItem(body, db) {
  const { item_name, category, description, price, image_url } = body;

  if (!item_name || !price) {
    return {
      error: "Missing required fields: item_name, price",
    };
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

  return {
    success: true,
    menu_item_id: result.insertId,
    message: "Menu item created successfully",
  };
}

export async function deleteMenuItem(body, db) {
  const { menu_item_id } = body;

  if (!menu_item_id) {
    return { error: "menu_item_id is required" };
  }

  const [result] = await db.query(
    "DELETE FROM menu_items WHERE menu_item_id = ?",
    [menu_item_id]
  );

  if (result.affectedRows === 0) {
    return { error: "Menu item not found" };
  }

  return {
    success: true,
    message: "Menu item deleted successfully",
  };
}
