export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT m.*, c.category_name
    FROM menu_items m
    LEFT JOIN menu_category_lookup c ON m.category = c.category_id
    ORDER BY m.item_name
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
