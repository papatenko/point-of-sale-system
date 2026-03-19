// ── Helper: parse query string from a raw URL ─────────────────────────────────
// mysql.js passes the raw URL string (e.g. "/api/inventory?licensePlate=TX-001")
// directly into route functions, so we parse params here rather than in mysql.js.
function parseParams(url) {
  const qs = url.includes("?") ? url.split("?")[1] : "";
  const params = {};
  qs.split("&").filter(Boolean).forEach((pair) => {
    const [key, val = ""] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(val);
  });
  return params;
}

// ── Helper: auto-create a reorder alert when stock drops below threshold ──────
async function maybeCreateAlert(db, licensePlate, ingredientId, newQty, reorderThreshold) {
  if (newQty >= parseFloat(reorderThreshold)) return false;

  const [[existing]] = await db.query(
    `SELECT alert_id FROM reorder_alerts
      WHERE license_plate = ? AND ingredient_id = ? AND alert_status = 'active'`,
    [licensePlate, ingredientId],
  );
  if (existing) return false;

  await db.query(
    `INSERT INTO reorder_alerts
       (license_plate, ingredient_id, current_quantity, reorder_threshold, alert_status)
     VALUES (?, ?, ?, ?, 'active')`,
    [licensePlate, ingredientId, newQty, reorderThreshold],
  );
  return true;
}

// ── GET /api/inventory?licensePlate=X ─────────────────────────────────────────
export async function getInventory(url, db) {
  const { licensePlate } = parseParams(url);
  if (!licensePlate) throw new Error("licensePlate query param required");

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
    inventoryId:        r.inventory_id,
    licensePlate:       r.license_plate,
    ingredientId:       r.ingredient_id,
    ingredientName:     r.ingredient_name,
    ingredientCategory: r.ingredient_category,
    unitOfMeasure:      r.unit_of_measure,
    quantityOnHand:     parseFloat(r.quantity_on_hand),
    reorderThreshold:   parseFloat(r.reorder_threshold),
    expirationDate:     r.expiration_date,
    lastRestocked:      r.last_restocked,
    needsReorder:       r.needs_reorder === 1,
    hasActiveAlert:     r.has_active_alert > 0,
  }));
}

// ── POST /api/inventory/use ───────────────────────────────────────────────────
// body: { licensePlate, ingredientId, quantityUsed, adjustmentType, reason, adjustedBy }
// adjustmentType: "order-deduction" | "waste"
export async function useInventory(body, db) {
  const { licensePlate, ingredientId, quantityUsed, adjustmentType, reason, adjustedBy } = body;

  if (!licensePlate || !ingredientId || !quantityUsed || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, ingredientId, quantityUsed, adjustedBy");
  }
  if (!["order-deduction", "waste"].includes(adjustmentType)) {
    throw new Error("adjustmentType must be 'order-deduction' or 'waste'");
  }
  if (quantityUsed <= 0) {
    throw new Error("quantityUsed must be greater than 0");
  }

  const [[current]] = await db.query(
    `SELECT quantity_on_hand, reorder_threshold
       FROM truck_inventory
      WHERE license_plate = ? AND ingredient_id = ?`,
    [licensePlate, ingredientId],
  );
  if (!current) throw new Error("Inventory record not found");

  const newQty = parseFloat(current.quantity_on_hand) - parseFloat(quantityUsed);
  if (newQty < 0) throw new Error(`Insufficient quantity. Current: ${current.quantity_on_hand}`);

  await db.query(
    `UPDATE truck_inventory SET quantity_on_hand = ?
      WHERE license_plate = ? AND ingredient_id = ?`,
    [newQty, licensePlate, ingredientId],
  );

  await db.query(
    `INSERT INTO inventory_adjustments
       (license_plate, ingredient_id, adjustment_type, quantity_change, reason, adjusted_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [licensePlate, ingredientId, adjustmentType, -parseFloat(quantityUsed), reason || null, adjustedBy],
  );

  const alertCreated = await maybeCreateAlert(
    db, licensePlate, ingredientId, newQty, current.reorder_threshold,
  );
  return { success: true, newQuantity: newQty, alertCreated };
}

// ── POST /api/inventory/use-recipe ───────────────────────────────────────────
// body: { licensePlate, menuItemId, quantity, adjustedBy }
export async function useRecipe(body, db) {
  const { licensePlate, menuItemId, quantity = 1, adjustedBy } = body;
  if (!licensePlate || !menuItemId || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, menuItemId, adjustedBy");
  }

  const [recipe] = await db.query(
    `SELECT ri.ingredient_id, ri.quantity_needed, i.ingredient_name, i.unit_of_measure
       FROM recipe_ingredient ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
      WHERE ri.menu_item_id = ?`,
    [menuItemId],
  );
  if (recipe.length === 0) throw new Error("No recipe found for this menu item");

  // Pre-flight: verify all ingredients have sufficient stock before touching anything
  const shortages = [];
  for (const r of recipe) {
    const needed = parseFloat(r.quantity_needed) * parseInt(quantity);
    const [[inv]] = await db.query(
      "SELECT quantity_on_hand FROM truck_inventory WHERE license_plate = ? AND ingredient_id = ?",
      [licensePlate, r.ingredient_id],
    );
    if (!inv || parseFloat(inv.quantity_on_hand) < needed) {
      shortages.push({
        ingredient: r.ingredient_name,
        needed,
        available: inv ? parseFloat(inv.quantity_on_hand) : 0,
      });
    }
  }
  if (shortages.length > 0) return { success: false, shortages };

  // Deduct each ingredient and create alerts as needed
  const alertsCreated = [];
  for (const r of recipe) {
    const needed = parseFloat(r.quantity_needed) * parseInt(quantity);
    const [[inv]] = await db.query(
      "SELECT quantity_on_hand, reorder_threshold FROM truck_inventory WHERE license_plate = ? AND ingredient_id = ?",
      [licensePlate, r.ingredient_id],
    );
    const newQty = parseFloat(inv.quantity_on_hand) - needed;

    await db.query(
      "UPDATE truck_inventory SET quantity_on_hand = ? WHERE license_plate = ? AND ingredient_id = ?",
      [newQty, licensePlate, r.ingredient_id],
    );
    await db.query(
      `INSERT INTO inventory_adjustments
         (license_plate, ingredient_id, adjustment_type, quantity_change, reason, adjusted_by)
       VALUES (?, ?, 'order-deduction', ?, ?, ?)`,
      [licensePlate, r.ingredient_id, -needed, `Made ${quantity}x menu item #${menuItemId}`, adjustedBy],
    );

    const created = await maybeCreateAlert(db, licensePlate, r.ingredient_id, newQty, inv.reorder_threshold);
    if (created) alertsCreated.push(r.ingredient_name);
  }

  return { success: true, alertsCreated };
}

// ── POST /api/inventory/reorder ───────────────────────────────────────────────
// Server-enforced: reorder is only permitted when qty < threshold.
// body: { licensePlate, ingredientId, quantityOrdered, createdBy }
export async function reorderInventory(body, db) {
  const { licensePlate, ingredientId, quantityOrdered, createdBy } = body;
  if (!licensePlate || !ingredientId || !quantityOrdered || !createdBy) {
    throw new Error("Missing required fields: licensePlate, ingredientId, quantityOrdered, createdBy");
  }
  if (quantityOrdered <= 0) throw new Error("quantityOrdered must be greater than 0");

  const [[inv]] = await db.query(
    "SELECT quantity_on_hand, reorder_threshold FROM truck_inventory WHERE license_plate = ? AND ingredient_id = ?",
    [licensePlate, ingredientId],
  );
  if (!inv) throw new Error("Inventory record not found");

  if (parseFloat(inv.quantity_on_hand) >= parseFloat(inv.reorder_threshold)) {
    throw new Error(
      `Reorder not allowed: quantity (${inv.quantity_on_hand}) is at or above threshold (${inv.reorder_threshold})`,
    );
  }

  const [[ing]] = await db.query(
    "SELECT preferred_supplier_id, ingredient_name, current_unit_cost FROM ingredients WHERE ingredient_id = ?",
    [ingredientId],
  );
  if (!ing) throw new Error("Ingredient not found");
  if (!ing.preferred_supplier_id) throw new Error("No preferred supplier set for this ingredient");

  const unitCost  = parseFloat(ing.current_unit_cost);
  const lineTotal = (unitCost * parseFloat(quantityOrdered)).toFixed(2);

  const [soResult] = await db.query(
    `INSERT INTO supply_orders (supplier_id, license_plate, created_by, status, total_cost)
     VALUES (?, ?, ?, 'pending', ?)`,
    [ing.preferred_supplier_id, licensePlate, createdBy, lineTotal],
  );
  const poId = soResult.insertId;

  await db.query(
    `INSERT INTO supply_order_items (po_id, ingredient_id, quantity_ordered, quantity_received, unit_cost, line_total)
     VALUES (?, ?, ?, 0, ?, ?)`,
    [poId, ingredientId, quantityOrdered, unitCost, lineTotal],
  );

  // Move any active alert for this ingredient to "ordered"
  await db.query(
    `UPDATE reorder_alerts SET alert_status = 'ordered'
      WHERE license_plate = ? AND ingredient_id = ? AND alert_status = 'active'`,
    [licensePlate, ingredientId],
  );

  return {
    success: true,
    poId,
    ingredientName: ing.ingredient_name,
    quantityOrdered,
    totalCost: parseFloat(lineTotal),
  };
}

// ── GET /api/inventory/alerts?licensePlate=X ──────────────────────────────────
export async function getInventoryAlerts(url, db) {
  const { licensePlate } = parseParams(url);
  if (!licensePlate) throw new Error("licensePlate query param required");

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
    alertId:          r.alert_id,
    ingredientId:     r.ingredient_id,
    ingredientName:   r.ingredient_name,
    unitOfMeasure:    r.unit_of_measure,
    quantityAtAlert:  parseFloat(r.current_quantity),
    reorderThreshold: parseFloat(r.reorder_threshold),
    currentActualQty: parseFloat(r.current_actual_qty),
    alertCreated:     r.alert_created,
    alertStatus:      r.alert_status,
  }));
}

// ── GET /api/inventory/history?licensePlate=X&limit=50 ────────────────────────
export async function getInventoryHistory(url, db) {
  const { licensePlate, limit = "50" } = parseParams(url);
  if (!licensePlate) throw new Error("licensePlate query param required");

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
    adjustmentId:   r.adjustment_id,
    ingredientId:   r.ingredient_id,
    ingredientName: r.ingredient_name,
    unitOfMeasure:  r.unit_of_measure,
    adjustmentType: r.adjustment_type,
    quantityChange: parseFloat(r.quantity_change),
    reason:         r.reason,
    adjustedBy:     r.adjusted_by,
    adjustmentDate: r.adjustment_date,
  }));
}