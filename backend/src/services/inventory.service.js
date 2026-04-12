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

export async function addIngredientToInventory(db, body) {
  const { licensePlate, ingredientId, quantityOnHand, reorderThreshold, expirationDate } = body;
  if (!licensePlate || !ingredientId || quantityOnHand == null || reorderThreshold == null) {
    throw new Error("Missing required fields: licensePlate, ingredientId, quantityOnHand, reorderThreshold");
  }
  if (parseFloat(quantityOnHand) < 0) throw new Error("quantityOnHand cannot be negative");
  if (parseFloat(reorderThreshold) < 0) throw new Error("reorderThreshold cannot be negative");

  const existing = await InventoryModel.findInventoryItem(db, licensePlate, ingredientId);
  if (existing) {
    throw new Error("This ingredient is already in the truck's inventory");
  }

  await InventoryModel.addIngredientToTruck(db, {
    licensePlate,
    ingredientId: parseInt(ingredientId),
    quantityOnHand: parseFloat(quantityOnHand),
    reorderThreshold: parseFloat(reorderThreshold),
    expirationDate: expirationDate || null,
  });

  return { success: true };
}

export async function reorderInventory(db, body) {
  const { licensePlate, ingredientId, quantityOrdered, createdBy, supplierId } = body;
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

  const resolvedSupplierId = supplierId ?? ing.preferred_supplier_id;
  if (!resolvedSupplierId) {
    throw new Error("No supplier selected and no preferred supplier set for this ingredient");
  }

  const unitCost = parseFloat(ing.current_unit_cost);
  const lineTotal = (unitCost * parseFloat(quantityOrdered)).toFixed(2);

  const orderResult = await InventoryModel.createSupplyOrder(db, {
    supplier_id: resolvedSupplierId,
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