export async function findById(db, orderId) {
  const [rows] = await db.query(
    `SELECT
       c.checkout_id,
       c.order_number,
       c.order_type,
       c.order_status,
       c.total_price,
       c.payment_method,
       c.payment_status,
       c.customer_email,
       c.scheduled_time,
       c.date_created,
       oi.order_item_id,
       oi.menu_item_id,
       oi.quantity,
       oi.line_total_price,
       m.item_name
     FROM checkout c
     LEFT JOIN order_items oi ON c.checkout_id = oi.order_id
     LEFT JOIN menu_items  m  ON oi.menu_item_id = m.menu_item_id
     WHERE c.checkout_id = ?`,
    [orderId],
  );

  if (rows.length === 0) return null;

  return {
    checkoutId: rows[0].checkout_id,
    orderNumber: rows[0].order_number,
    orderType: rows[0].order_type,
    orderStatus: rows[0].order_status,
    totalPrice: rows[0].total_price,
    paymentMethod: rows[0].payment_method,
    paymentStatus: rows[0].payment_status,
    customerEmail: rows[0].customer_email,
    scheduledTime: rows[0].scheduled_time ?? null,
    dateCreated: rows[0].date_created ?? null,
    items: rows
      .filter((r) => r.order_item_id !== null)
      .map((r) => ({
        orderItemId: r.order_item_id,
        menuItemId: r.menu_item_id,
        name: r.item_name,
        quantity: r.quantity,
        lineTotal: r.line_total_price,
      })),
  };
}
