import * as InventoryModel from "../models/inventory.model.js";

export async function getInventory(db, url) {
  const { licensePlate } = InventoryModel.parseParams(url);
  if (!licensePlate) {
    throw new Error("licensePlate query param required");
  }
  return await InventoryModel.findByLicensePlate(db, licensePlate);
}

export async function useInventory(db, body) {
  const { licensePlate, ingredientId, quantityUsed, adjustmentType, reason, adjustedBy } = body;

  if (!licensePlate || !ingredientId || !quantityUsed || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, ingredientId, quantityUsed, adjustedBy");
  }
  if (!["order-deduction", "waste"].includes(adjustmentType)) {
    throw new Error("adjustmentType must be 'order-deduction' or 'waste'");
  }
  if (parseFloat(quantityUsed) <= 0) {
    throw new Error("quantityUsed must be greater than 0");
  }

  const current = await InventoryModel.findInventoryItem(db, licensePlate, ingredientId);
  if (!current) {
    throw new Error("Inventory record not found");
  }

  const newQty = parseFloat(current.quantity_on_hand) - parseFloat(quantityUsed);
  if (newQty < 0) {
    throw new Error(`Insufficient quantity. Current: ${current.quantity_on_hand}`);
  }

  await InventoryModel.updateQuantity(db, licensePlate, ingredientId, newQty);

  await InventoryModel.createAdjustment(db, {
    license_plate: licensePlate,
    ingredient_id: ingredientId,
    adjustment_type: adjustmentType,
    quantity_change: -parseFloat(quantityUsed),
    reason,
    adjusted_by: adjustedBy,
  });

  return { success: true, newQuantity: newQty };
}

export async function useRecipe(db, body) {
  const { licensePlate, menuItemId, quantity = 1, adjustedBy } = body;
  if (!licensePlate || !menuItemId || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, menuItemId, adjustedBy");
  }

  const recipe = await InventoryModel.findRecipeByMenuItem(db, menuItemId);
  if (recipe.length === 0) {
    throw new Error("No recipe found for this menu item");
  }

  const shortages = [];
  for (const r of recipe) {
    const needed = parseFloat(r.quantity_needed) * parseInt(quantity);
    const item = await InventoryModel.findInventoryItem(db, licensePlate, r.ingredient_id);
    if (!item || parseFloat(item.quantity_on_hand) < needed) {
      shortages.push({
        ingredient: r.ingredient_name,
        needed,
        available: item ? parseFloat(item.quantity_on_hand) : 0,
      });
    }
  }
  if (shortages.length > 0) {
    return { success: false, shortages };
  }

  for (const r of recipe) {
    const needed = parseFloat(r.quantity_needed) * parseInt(quantity);
    const item = await InventoryModel.findInventoryItem(db, licensePlate, r.ingredient_id);
    const newQty = parseFloat(item.quantity_on_hand) - needed;

    await InventoryModel.updateQuantity(db, licensePlate, r.ingredient_id, newQty);

    await InventoryModel.createAdjustment(db, {
      license_plate: licensePlate,
      ingredient_id: r.ingredient_id,
      adjustment_type: "order-deduction",
      quantity_change: -needed,
      reason: `Made ${quantity}x menu item #${menuItemId}`,
      adjusted_by: adjustedBy,
    });
  }

  return { success: true };
}

/**
 * NEW: Deduct inventory by menu item + quantity.
 * Looks up the recipe for the given menu item, checks for shortages,
 * then deducts all ingredients accordingly.
 *
 * Body: { licensePlate, menuItemId, menuItemName, quantity, adjustedBy }
 */
export async function useMenuItem(db, body) {
  const { licensePlate, menuItemId, menuItemName, quantity = 1, adjustedBy } = body;

  if (!licensePlate || !menuItemId || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, menuItemId, adjustedBy");
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error("quantity must be a positive integer");
  }

  // Fetch the recipe for this menu item
  const recipe = await InventoryModel.findRecipeByMenuItem(db, menuItemId);
  if (recipe.length === 0) {
    throw new Error(`No recipe found for "${menuItemName || `menu item #${menuItemId}`}". Add ingredients to this item's recipe first.`);
  }

  // Pre-check all ingredients for shortages
  const shortages = [];
  for (const r of recipe) {
    const needed = parseFloat(r.quantity_needed) * qty;
    const item = await InventoryModel.findInventoryItem(db, licensePlate, r.ingredient_id);
    if (!item || parseFloat(item.quantity_on_hand) < needed) {
      shortages.push({
        ingredient: r.ingredient_name,
        unit: r.unit_of_measure,
        needed,
        available: item ? parseFloat(item.quantity_on_hand) : 0,
      });
    }
  }

  if (shortages.length > 0) {
    return { success: false, shortages };
  }

  // Apply all deductions
  const deductions = [];

  for (const r of recipe) {
    const needed = parseFloat(r.quantity_needed) * qty;
    const item = await InventoryModel.findInventoryItem(db, licensePlate, r.ingredient_id);
    const newQty = parseFloat(item.quantity_on_hand) - needed;

    await InventoryModel.updateQuantity(db, licensePlate, r.ingredient_id, newQty);

    await InventoryModel.createAdjustment(db, {
      license_plate: licensePlate,
      ingredient_id: r.ingredient_id,
      adjustment_type: "order-deduction",
      quantity_change: -needed,
      reason: `Made ${qty}x ${menuItemName || `menu item #${menuItemId}`}`,
      adjusted_by: adjustedBy,
    });

    deductions.push({
      ingredientName: r.ingredient_name,
      unit: r.unit_of_measure,
      deducted: needed,
      remaining: newQty,
    });
  }

  return {
    success: true,
    menuItemName: menuItemName || `Menu item #${menuItemId}`,
    quantityMade: qty,
    deductions,
  };
}

/**
 * NEW: Deduct inventory for multiple menu items prepared during the day.
 * Aggregates ingredients needed for all items and deducts in bulk.
 *
 * Body: { licensePlate, productions: [{menuItemId, quantity}, ...], adjustedBy }
 * Returns: { success, alertsCreated: [ingredientNames] }
 */
export async function useDailyProduction(db, body) {
  const { licensePlate, productions, adjustedBy } = body;

  if (!licensePlate || !productions || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, productions, adjustedBy");
  }

  if (!Array.isArray(productions) || productions.length === 0) {
    throw new Error("productions must be a non-empty array");
  }

  // Aggregate all ingredients needed
  const aggregatedIngredients = {}; // { ingredientId: { needed, menuItemId, menuItemName } }

  for (const prod of productions) {
    const menuItemId = prod.menuItemId;
    const qty = parseInt(prod.quantity);

    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid quantity for menu item ${menuItemId}`);
    }

    // Fetch recipe for this menu item
    const recipe = await InventoryModel.findRecipeByMenuItem(db, menuItemId);
    if (recipe.length === 0) {
      throw new Error(`No recipe found for menu item #${menuItemId}`);
    }

    // Add to aggregated ingredients
    for (const r of recipe) {
      const needed = parseFloat(r.quantity_needed) * qty;
      const ingId = r.ingredient_id;

      if (!aggregatedIngredients[ingId]) {
        aggregatedIngredients[ingId] = {
          needed: 0,
          menuItemId,
          menuItemName: r.ingredient_name,
          unitOfMeasure: r.unit_of_measure,
        };
      }
      aggregatedIngredients[ingId].needed += needed;
    }
  }

  // Pre-check: verify all ingredients are available
  const shortages = [];
  for (const [ingId, agg] of Object.entries(aggregatedIngredients)) {
    const item = await InventoryModel.findInventoryItem(db, licensePlate, ingId);
    if (!item || parseFloat(item.quantity_on_hand) < agg.needed) {
      shortages.push({
        ingredient: agg.menuItemName,
        unit: agg.unitOfMeasure,
        needed: agg.needed,
        available: item ? parseFloat(item.quantity_on_hand) : 0,
      });
    }
  }

  if (shortages.length > 0) {
    return { success: false, shortages };
  }

  // Apply all deductions
  const productionSummary = productions.map((p) => `${p.quantity}x menu item #${p.menuItemId}`).join(", ");

  for (const [ingId, agg] of Object.entries(aggregatedIngredients)) {
    const item = await InventoryModel.findInventoryItem(db, licensePlate, ingId);
    const newQty = parseFloat(item.quantity_on_hand) - agg.needed;

    await InventoryModel.updateQuantity(db, licensePlate, ingId, newQty);

    await InventoryModel.createAdjustment(db, {
      license_plate: licensePlate,
      ingredient_id: ingId,
      adjustment_type: "order-deduction",
      quantity_change: -agg.needed,
      reason: `Daily production: ${productionSummary}`,
      adjusted_by: adjustedBy,
    });
  }

  return { success: true };
}

/**
 * NEW: Expire all inventory items for a truck that have passed their
 * expiration_date. Sets quantity_on_hand = 0 and logs a "waste" adjustment.
 *
 * Body: { licensePlate, adjustedBy }
 * Returns: { success, expired: [{ ingredientName, previousQty, unit }] }
 */
export async function expireInventory(db, body) {
  const { licensePlate, adjustedBy } = body;

  if (!licensePlate || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, adjustedBy");
  }

  const expiredItems = await InventoryModel.findExpiredItems(db, licensePlate);

  if (expiredItems.length === 0) {
    return { success: true, expired: [], message: "No expired items found." };
  }

  const expired = [];

  for (const item of expiredItems) {
    // Zero out the quantity
    await InventoryModel.zeroQuantity(db, licensePlate, item.ingredientId);

    // Record waste adjustment
    await InventoryModel.createAdjustment(db, {
      license_plate: licensePlate,
      ingredient_id: item.ingredientId,
      adjustment_type: "waste",
      quantity_change: -item.quantityOnHand,
      reason: `Expired on ${new Date(item.expirationDate).toLocaleDateString()} — auto-expired`,
      adjusted_by: adjustedBy,
    });

    // Reorder alert creation is now handled by a database trigger; no backend code needed here.

    expired.push({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      previousQty: item.quantityOnHand,
      unit: item.unitOfMeasure,
      expirationDate: item.expirationDate,
    });
  }

  return { success: true, expired };
}

export async function reorderInventory(db, body) {
  const { licensePlate, ingredientId, quantityOrdered, createdBy } = body;
  if (!licensePlate || !ingredientId || !quantityOrdered || !createdBy) {
    throw new Error("Missing required fields: licensePlate, ingredientId, quantityOrdered, createdBy");
  }
  if (parseFloat(quantityOrdered) <= 0) {
    throw new Error("quantityOrdered must be greater than 0");
  }

  const inv = await InventoryModel.findInventoryItem(db, licensePlate, ingredientId);
  if (!inv) {
    throw new Error("Inventory record not found");
  }

  if (parseFloat(inv.quantity_on_hand) >= parseFloat(inv.reorder_threshold)) {
    throw new Error(
      `Reorder not allowed: quantity (${inv.quantity_on_hand}) is at or above threshold (${inv.reorder_threshold})`,
    );
  }

  const ing = await InventoryModel.findIngredientById(db, ingredientId);
  if (!ing) {
    throw new Error("Ingredient not found");
  }
  if (!ing.preferred_supplier_id) {
    throw new Error("No preferred supplier set for this ingredient");
  }

  const unitCost = parseFloat(ing.current_unit_cost);
  const lineTotal = (unitCost * parseFloat(quantityOrdered)).toFixed(2);

  const orderResult = await InventoryModel.createSupplyOrder(db, {
    supplier_id: ing.preferred_supplier_id,
    license_plate: licensePlate,
    created_by: createdBy,
    total_cost: lineTotal,
  });
  const poId = orderResult.insertId;

  await InventoryModel.createSupplyOrderItem(db, {
    po_id: poId,
    ingredient_id: ingredientId,
    quantity_ordered: quantityOrdered,
    unit_cost: unitCost,
    line_total: lineTotal,
  });

  await InventoryModel.updateAlertStatus(db, licensePlate, ingredientId, "ordered");

  return {
    success: true,
    poId,
    ingredientName: ing.ingredient_name,
    quantityOrdered,
    totalCost: parseFloat(lineTotal),
  };
}

export async function getAlerts(db, url) {
  const { licensePlate } = InventoryModel.parseParams(url);
  if (!licensePlate) {
    throw new Error("licensePlate query param required");
  }
  return await InventoryModel.findAlertsByLicensePlate(db, licensePlate);
}

export async function getHistory(db, url) {
  const { licensePlate, limit = "50" } = InventoryModel.parseParams(url);
  if (!licensePlate) {
    throw new Error("licensePlate query param required");
  }
  return await InventoryModel.findHistoryByLicensePlate(db, licensePlate, limit);
}

/**
 * NEW: Get today's sales by menu item (excluding pending/cancelled orders)
 * for a given truck. Used to auto-populate daily production quantities.
 *
 * Query: licensePlate
 * Returns: [{ menuItemId, itemName, totalQuantity }]
 */
export async function getTodaysSales(db, url) {
  const { licensePlate } = InventoryModel.parseParams(url);
  if (!licensePlate) {
    throw new Error("licensePlate query param required");
  }
  return await InventoryModel.findTodaysSalesByMenuItem(db, licensePlate);
}