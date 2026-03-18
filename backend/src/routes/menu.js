import { getDatabase } from "../mysql.js";

export async function getMenu() {
  const database = await getDatabase();
  const [rows] = await database.query(`
    SELECT
      m.menu_item_id,
      m.item_name,
      m.category,
      c.category_name,
      m.description,
      m.price,
      m.is_available,
      m.image_url
    FROM menu_items m
    JOIN menu_category_lookup c ON m.category = c.category_id
    WHERE m.is_available = TRUE
    ORDER BY m.category, m.item_name
  `);
  console.log("Fetching menu items:", rows.length);
  return rows;
}
