import { database } from "../mysql.js";

export async function insertTransation(transaction) {
  const { items, total } = transaction;
  
  const orderNumber = "ORD-" + Date.now();
  const query = "INSERT INTO checkout (order_number, license_plate, order_type, order_status, total_price, payment_method, payment_status) VALUES (?, 'TEST001', 'walk-in', 'completed', ?, 'cash', 'completed')";
  const result = await database.query(query, [orderNumber, total]);
  
  console.log("Transaction inserted:", result);
  return { orderNumber, items, total, status: "completed" };
}
