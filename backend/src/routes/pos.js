//TODO: get junk to work
import { database } from "../mysql.js";

export async function insertTransation(transation) {
  const { order_item_id, order_id, menu_item_id, quantity, line_total_price } =
    transation;

  const [results] = await database.query(
    `INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, line_total_price) VALUES (?, ?, ?, ?, ?)`,
    [order_item_id, order_id, menu_item_id, quantity, line_total_price],
  );
  return results;
}
