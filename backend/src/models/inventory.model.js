// backend/src/models/inventory.model.js
function parseParams(url) {
  const qs = url.includes("?") ? url.split("?")[1] : "";
  const params = {};
  qs.split("&").filter(Boolean).forEach((pair) => {
    const [key, val = ""] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(val);
  });
  return params;
}

export { parseParams };

export async function findByLicensePlate(db, licensePlate) {
  const [rows] = await db.query(
    `SELECT
       ti.inventory_id,
       ti.license_plate,
       ti.ingredient_id,
       i.ingredient_name,
       i.category        AS ingredient_category,
       i.unit_of_measure,
       ti.quantity_on_hand,
       ti.reorder_threshold,
       ti.expiration_date,
       ti.last_restocked,
       (ti.quantity_on_hand < ti.reorder_threshold) AS needs_reorder,
       (SELECT COUNT(*) FROM reorder_alerts ra
        WHERE ra.license_plate = ti.license_plate
          AND ra.ingredient_id  = ti.ingredient_id
          AND ra.alert_status   = 'active') AS has_active_alert
      FROM truck_inventory ti
      JOIN ingredients i ON ti.ingredient_id = i.ingredient_id
      WHERE ti.license_plate = ?
      ORDER BY i.category, i.ingredient_name`,
    [licensePlate],
  );

  return rows.map((r) => ({
    inventoryId: r.inventory_id,
    licensePlate: r.license_plate,
    ingredientId: r.ingredient_id,
    ingredientName: r.ingredient_name,
    ingredientCategory: r.ingredient_category,
    unitOfMeasure: r.unit_of_measure,
    quantityOnHand: parseFloat(r.quantity_on_hand),
    reorderThreshold: parseFloat(r.reorder_threshold),
    expirationDate: r.expiration_date,
    lastRestocked: r.last_restocked,
    needsReorder: r.needs_reorder === 1,
    hasActiveAlert: r.has_active_alert > 0,
  }));
}

export async function findInventoryItem(db, licensePlate, ingredientId) {
  const [[row]] = await db.query(
    `SELECT quantity_on_hand, reorder_threshold
       FROM truck_inventory
      WHERE license_plate = ? AND ingredient_id = ?`,
    [licensePlate, ingredientId],
  );
  return row;
}

export async function updateQuantity(db, licensePlate, ingredientId, newQty) {
  await db.query(
    `UPDATE truck_inventory SET quantity_on_hand = ?
       WHERE license_plate = ? AND ingredient_id = ?`,
    [newQty, licensePlate, ingredientId],
  );
}

export async function createAdjustment(db, data) {
  await db.query(
    `INSERT INTO inventory_adjustments
       (license_plate, ingredient_id, adjustment_type, quantity_change, reason, adjusted_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.license_plate,
      data.ingredient_id,
      data.adjustment_type,
      data.quantity_change,
      data.reason || null,
      data.adjusted_by,
    ],
  );
}


export async function findIngredientById(db, ingredientId) {
  const [[row]] = await db.query(
    "SELECT preferred_supplier_id, ingredient_name, current_unit_cost FROM ingredients WHERE ingredient_id = ?",
    [ingredientId],
  );
  return row;
}

export async function createSupplyOrder(db, data) {
  const [result] = await db.query(
    `INSERT INTO supply_orders (supplier_id, license_plate, created_by, status, total_cost)
     VALUES (?, ?, ?, ?, ?)`,
    [data.supplier_id, data.license_plate, data.created_by, data.status ?? "ordered", data.total_cost],
  );
  return result;
}

export async function createSupplyOrderItem(db, data) {
  await db.query(
    `INSERT INTO supply_order_items (po_id, ingredient_id, quantity_ordered, quantity_received, unit_cost, line_total)
     VALUES (?, ?, ?, 0, ?, ?)`,
    [data.po_id, data.ingredient_id, data.quantity_ordered, data.unit_cost, data.line_total],
  );
}

export async function updateAlertStatus(db, licensePlate, ingredientId, status) {
  await db.query(
    `UPDATE reorder_alerts SET alert_status = ?
       WHERE license_plate = ? AND ingredient_id = ? AND alert_status = 'active'`,
    [status, licensePlate, ingredientId],
  );
}

export async function findAlertsByLicensePlate(db, licensePlate) {
  const [rows] = await db.query(
    `SELECT
       ra.alert_id, ra.ingredient_id, i.ingredient_name, i.unit_of_measure,
       ra.current_quantity, ra.reorder_threshold, ra.alert_created, ra.alert_status,
       ti.quantity_on_hand AS current_actual_qty
      FROM reorder_alerts ra
      JOIN ingredients i      ON ra.ingredient_id = i.ingredient_id
      JOIN truck_inventory ti ON ra.license_plate  = ti.license_plate
                              AND ra.ingredient_id = ti.ingredient_id
      WHERE ra.license_plate = ?
        AND ra.alert_status IN ('active', 'ordered')
      ORDER BY ra.alert_created DESC`,
    [licensePlate],
  );

  return rows.map((r) => ({
    alertId: r.alert_id,
    ingredientId: r.ingredient_id,
    ingredientName: r.ingredient_name,
    unitOfMeasure: r.unit_of_measure,
    quantityAtAlert: parseFloat(r.current_quantity),
    reorderThreshold: parseFloat(r.reorder_threshold),
    currentActualQty: parseFloat(r.current_actual_qty),
    alertCreated: r.alert_created,
    alertStatus: r.alert_status,
  }));
}

export async function findHistoryByLicensePlate(db, licensePlate, limit = 50) {
  const [rows] = await db.query(
    `SELECT
       ia.adjustment_id, ia.ingredient_id, i.ingredient_name, i.unit_of_measure,
       ia.adjustment_type, ia.quantity_change, ia.reason, ia.adjusted_by, ia.adjustment_date
      FROM inventory_adjustments ia
      JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
      WHERE ia.license_plate = ?
      ORDER BY ia.adjustment_date DESC
      LIMIT ?`,
    [licensePlate, parseInt(limit)],
  );

  return rows.map((r) => ({
    adjustmentId: r.adjustment_id,
    ingredientId: r.ingredient_id,
    ingredientName: r.ingredient_name,
    unitOfMeasure: r.unit_of_measure,
    adjustmentType: r.adjustment_type,
    quantityChange: parseFloat(r.quantity_change),
    reason: r.reason,
    adjustedBy: r.adjusted_by,
    adjustmentDate: r.adjustment_date,
  }));
}

export async function findRecipeByMenuItem(db, menuItemId) {
  const [rows] = await db.query(
    `SELECT ri.ingredient_id, ri.quantity_needed, i.ingredient_name, i.unit_of_measure
       FROM recipe_ingredient ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
      WHERE ri.menu_item_id = ?`,
    [menuItemId],
  );
  return rows;
}

export async function findExpiredItems(db, licensePlate) {
  const [rows] = await db.query(
    `SELECT
       ti.inventory_id,
       ti.license_plate,
       ti.ingredient_id,
       i.ingredient_name,
       i.unit_of_measure,
       ti.quantity_on_hand,
       ti.expiration_date
     FROM truck_inventory ti
     JOIN ingredients i ON ti.ingredient_id = i.ingredient_id
     WHERE ti.license_plate = ?
       AND ti.expiration_date IS NOT NULL
       AND ti.expiration_date < NOW()
       AND ti.quantity_on_hand > 0`,
    [licensePlate],
  );
  return rows.map((r) => ({
    inventoryId: r.inventory_id,
    licensePlate: r.license_plate,
    ingredientId: r.ingredient_id,
    ingredientName: r.ingredient_name,
    unitOfMeasure: r.unit_of_measure,
    quantityOnHand: parseFloat(r.quantity_on_hand),
    expirationDate: r.expiration_date,
  }));
}

export async function zeroQuantity(db, licensePlate, ingredientId) {
  await db.query(
    `UPDATE truck_inventory SET quantity_on_hand = 0
     WHERE license_plate = ? AND ingredient_id = ?`,
    [licensePlate, ingredientId],
  );
}

export async function findTodaysSalesByMenuItem(db, licensePlate) {
  const [rows] = await db.query(
    `SELECT
       oi.menu_item_id,
       m.item_name,
       SUM(oi.quantity) AS total_quantity
     FROM checkout c
     JOIN order_items oi ON c.checkout_id = oi.order_id
     JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
     WHERE c.license_plate = ?
       AND DATE(c.scheduled_time) = CURDATE()
       AND c.order_status NOT IN ('pending', 'cancelled')
     GROUP BY oi.menu_item_id, m.item_name
     ORDER BY m.item_name`,
    [licensePlate],
  );

  return rows.map((r) => ({
    menuItemId: r.menu_item_id,
    itemName: r.item_name,
    totalQuantity: parseInt(r.total_quantity),
  }));
}

// ── Supply-order receipt helpers ───────────────────────────────────────────

/**
 * Fetch all supply orders in status 'pending' or 'ordered' for a given truck,
 * joined with their line items and ingredient names.
 */
export async function findPendingSupplyOrders(db, licensePlate) {
  const [rows] = await db.query(
    `SELECT
       so.po_id,
       so.supplier_id,
       s.supplier_name,
       so.license_plate,
       so.created_by,
       so.expected_delivery_date,
       so.actual_delivery_date,
       so.status,
       so.total_cost,
       soi.po_item_id,
       soi.ingredient_id,
       i.ingredient_name,
       i.unit_of_measure,
       soi.quantity_ordered,
       soi.quantity_received,
       soi.unit_cost,
       soi.line_total
     FROM supply_orders so
     JOIN suppliers s          ON so.supplier_id    = s.supplier_id
     JOIN supply_order_items soi ON so.po_id        = soi.po_id
     JOIN ingredients i          ON soi.ingredient_id = i.ingredient_id
     WHERE so.license_plate = ?
       AND so.status IN ('pending', 'ordered')
     ORDER BY so.po_id DESC, i.ingredient_name`,
    [licensePlate],
  );

  // Group line items under their parent PO
  const ordersMap = new Map();
  for (const row of rows) {
    if (!ordersMap.has(row.po_id)) {
      ordersMap.set(row.po_id, {
        poId: row.po_id,
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        licensePlate: row.license_plate,
        createdBy: row.created_by,
        expectedDeliveryDate: row.expected_delivery_date,
        actualDeliveryDate: row.actual_delivery_date,
        status: row.status,
        totalCost: parseFloat(row.total_cost),
        items: [],
      });
    }
    ordersMap.get(row.po_id).items.push({
      poItemId: row.po_item_id,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name,
      unitOfMeasure: row.unit_of_measure,
      quantityOrdered: parseFloat(row.quantity_ordered),
      quantityReceived: parseFloat(row.quantity_received),
      unitCost: parseFloat(row.unit_cost),
      lineTotal: parseFloat(row.line_total),
    });
  }

  return Array.from(ordersMap.values());
}

/**
 * Update how much of a PO line item was actually received.
 */
export async function updateSupplyOrderItemReceived(db, poItemId, quantityReceived) {
  await db.query(
    `UPDATE supply_order_items SET quantity_received = ? WHERE po_item_id = ?`,
    [quantityReceived, poItemId],
  );
}

/**
 * Mark the overall supply_order as received:
 *   status → 'received', actual_delivery_date → today, received_by → employee email.
 */
export async function markSupplyOrderReceived(db, poId) {
  await db.query(
    `UPDATE supply_orders
     SET status               = 'received',
         actual_delivery_date = CURDATE()
     WHERE po_id = ?`,
    [poId],
  );
}

/**
 * Add received quantity to truck_inventory and refresh last_restocked.
 */
export async function restockInventoryItem(db, licensePlate, ingredientId, quantityReceived) {
  await db.query(
    `UPDATE truck_inventory ti
     JOIN ingredients i ON i.ingredient_id = ti.ingredient_id
     SET ti.quantity_on_hand = ti.quantity_on_hand + ?,
         ti.last_restocked   = NOW(),
         ti.expiration_date  = CASE
           WHEN i.storage_time IS NOT NULL
           THEN DATE_ADD(NOW(), INTERVAL i.storage_time DAY)
           ELSE ti.expiration_date
         END
     WHERE ti.license_plate = ?
       AND ti.ingredient_id = ?`,
    [quantityReceived, licensePlate, ingredientId],
  );
}

/**
 * Resolve active/ordered reorder_alerts for an ingredient on a truck.
 * Fills resolved_date and resolved_by which were previously NULL.
 */
export async function resolveReorderAlerts(db, licensePlate, ingredientId, resolvedBy) {
  await db.query(
    `UPDATE reorder_alerts
     SET alert_status  = 'resolved',
         resolved_date = NOW(),
         resolved_by   = ?
     WHERE license_plate = ?
       AND ingredient_id = ?
       AND alert_status IN ('active', 'ordered')`,
    [resolvedBy, licensePlate, ingredientId],
  );
}

/**
 * Log a restock inventory_adjustment so the history tab reflects the receipt.
 * Uses reference_id to link back to the supply order PO.
 */
export async function logRestockAdjustment(db, licensePlate, ingredientId, quantityReceived, poId, receivedBy) {
  await db.query(
    `INSERT INTO inventory_adjustments
       (license_plate, ingredient_id, adjustment_type, quantity_change, reason, adjusted_by)
     VALUES (?, ?, 'restock', ?, ?, ?)`,
    [
      licensePlate,
      ingredientId,
      quantityReceived,
      `Supply order PO-${poId} received`,
      receivedBy,
    ],
  );
}