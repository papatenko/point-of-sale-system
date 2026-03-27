// backend/src/services/inventory.service.js
import { verifyToken } from "../auth/jwt.js";
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

export async function useMenuItem(db, body) {
  const { licensePlate, menuItemId, menuItemName, quantity = 1, adjustedBy } = body;

  if (!licensePlate || !menuItemId || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, menuItemId, adjustedBy");
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error("quantity must be a positive integer");
  }

  const recipe = await InventoryModel.findRecipeByMenuItem(db, menuItemId);
  if (recipe.length === 0) {
    throw new Error(`No recipe found for "${menuItemName || `menu item #${menuItemId}`}". Add ingredients to this item's recipe first.`);
  }

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

export async function useDailyProduction(db, body) {
  const { licensePlate, productions, adjustedBy } = body;

  if (!licensePlate || !productions || !adjustedBy) {
    throw new Error("Missing required fields: licensePlate, productions, adjustedBy");
  }

  if (!Array.isArray(productions) || productions.length === 0) {
    throw new Error("productions must be a non-empty array");
  }

  const aggregatedIngredients = {};

  for (const prod of productions) {
    const menuItemId = prod.menuItemId;
    const qty = parseInt(prod.quantity);

    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid quantity for menu item ${menuItemId}`);
    }

    const recipe = await InventoryModel.findRecipeByMenuItem(db, menuItemId);
    if (recipe.length === 0) {
      throw new Error(`No recipe found for menu item #${menuItemId}`);
    }

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
    await InventoryModel.zeroQuantity(db, licensePlate, item.ingredientId);

    await InventoryModel.createAdjustment(db, {
      license_plate: licensePlate,
      ingredient_id: item.ingredientId,
      adjustment_type: "waste",
      quantity_change: -item.quantityOnHand,
      reason: `Expired on ${new Date(item.expirationDate).toLocaleDateString()} — auto-expired`,
      adjusted_by: adjustedBy,
    });

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
    status: "ordered",
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

export async function getTodaysSales(db, url) {
  const { licensePlate } = InventoryModel.parseParams(url);
  if (!licensePlate) {
    throw new Error("licensePlate query param required");
  }
  return await InventoryModel.findTodaysSalesByMenuItem(db, licensePlate);
}

// ── Supply-order receipt ───────────────────────────────────────────────────

/**
 * GET pending supply orders for a truck.
 * Extracts the role from the JWT and enforces manager/admin access internally.
 */
export async function getPendingSupplyOrders(db, url, req) {
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);
  if (!payload || (payload.role !== "manager" && payload.role !== "admin")) {
    return { error: "Forbidden: managers and admins only" };
  }
  const { licensePlate } = InventoryModel.parseParams(url);
  if (!licensePlate) {
    throw new Error("licensePlate query param required");
  }
  return await InventoryModel.findPendingSupplyOrders(db, licensePlate);
}

/**
 * Mark a supply order as received, restock inventory, resolve alerts.
 * Extracts receivedBy and enforces manager/admin access from the JWT internally.
 *
 * Body: {
 *   poId:         number,
 *   licensePlate: string,
 *   items: [{ poItemId, ingredientId, quantityReceived }]
 * }
 */
export async function receiveSupplyOrder(db, body, req) {
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);
  if (!payload || (payload.role !== "manager" && payload.role !== "admin")) {
    return { error: "Forbidden: managers and admins only" };
  }

  const { poId, licensePlate, items } = body;
  const receivedBy = payload.email;

  if (!poId || !licensePlate) {
    throw new Error("poId and licensePlate are required");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items must be a non-empty array");
  }

  for (const item of items) {
    const qty = parseFloat(item.quantityReceived);
    if (isNaN(qty) || qty < 0) {
      throw new Error(`Invalid quantityReceived for item ${item.poItemId}`);
    }

    // 1. Record quantity received on the PO line item
    await InventoryModel.updateSupplyOrderItemReceived(db, item.poItemId, qty);

    if (qty > 0) {
      // 2. Add to truck_inventory; refresh last_restocked
      await InventoryModel.restockInventoryItem(db, licensePlate, item.ingredientId, qty);

      // 3. Resolve open reorder_alerts — fills resolved_date + resolved_by
      await InventoryModel.resolveReorderAlerts(db, licensePlate, item.ingredientId, receivedBy);

      // 4. Write a restock row to inventory_adjustments for the history tab
      await InventoryModel.logRestockAdjustment(
        db, licensePlate, item.ingredientId, qty, poId, receivedBy,
      );
    }
  }

  // 5. Mark supply_order as received — fills actual_delivery_date
  await InventoryModel.markSupplyOrderReceived(db, poId);

  return { success: true, message: `Supply order PO-${poId} marked as received.` };
}