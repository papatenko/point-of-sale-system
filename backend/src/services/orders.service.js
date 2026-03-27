import * as OrdersModel from "../models/orders.model.js";

export async function getOrderById(db, url) {
  const orderId = url.replace("/api/orders/", "");
  const order = await OrdersModel.findById(db, orderId);
  if (!order) {
    return { error: "Order not found" };
  }
  return order;
}

export async function listOrders(db, url) {
  const { searchParams } = new URL(url, "http://localhost");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = `SELECT checkout_id, order_number, order_type, order_status,
                      total_price, payment_method, customer_email
               FROM checkout WHERE 1=1`;
  const params = [];

  if (status) {
    const list = status.split(",").map((s) => s.trim());
    query += ` AND order_status IN (${list.map(() => "?").join(",")})`;
    params.push(...list);
  }
  if (search) {
    query += ` AND order_number LIKE ?`;
    params.push(`%${search}%`);
  }
  query += ` ORDER BY checkout_id DESC`;

  const [rows] = await db.query(query, params);
  return rows;
}
