export async function createCheckout(db, body) {
  const { customerEmail, paymentMethod, licensePlate, items } = body;

  if (!items || items.length === 0) {
    throw new Error("Cart is empty.");
  }
  if (!licensePlate) {
    throw new Error("Please select a pickup location.");
  }

  const orderNumber = "ORD-" + Date.now();
  const total = items
    .reduce((sum, i) => sum + parseFloat(i.price) * parseInt(i.quantity), 0)
    .toFixed(2);

  const [result] = await db.query(
    `INSERT INTO checkout 
       (order_number, license_plate, customer_email, order_type, order_status, scheduled_time, total_price, payment_method, payment_status)
     VALUES (?, ?, ?, 'online-pickup', 'pending', NOW(), ?, ?, 'pending')`,
    [orderNumber, licensePlate, customerEmail || null, total, paymentMethod],
  );
  const orderId = result.insertId;

  for (const item of items) {
    const lineTotal = (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2);
    await db.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total_price) VALUES (?, ?, ?, ?)`,
      [orderId, item.menuItemId, item.quantity, lineTotal],
    );
  }

  return { orderId, orderNumber };
}
