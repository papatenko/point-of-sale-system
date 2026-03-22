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

  const existingAlert = await InventoryModel.findActiveAlert(db, licensePlate, ingredientId);
  let alertCreated = false;
  if (!existingAlert && newQty < parseFloat(current.reorder_threshold)) {
    await InventoryModel.createAlert(db, {
      license_plate: licensePlate,
      ingredient_id: ingredientId,
      current_quantity: newQty,
      reorder_threshold: current.reorder_threshold,
    });
    alertCreated = true;
  }

  return { success: true, newQuantity: newQty, alertCreated };
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

  const alertsCreated = [];
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

    const existingAlert = await InventoryModel.findActiveAlert(db, licensePlate, r.ingredient_id);
    if (!existingAlert && newQty < parseFloat(item.reorder_threshold)) {
      await InventoryModel.createAlert(db, {
        license_plate: licensePlate,
        ingredient_id: r.ingredient_id,
        current_quantity: newQty,
        reorder_threshold: item.reorder_threshold,
      });
      alertsCreated.push(r.ingredient_name);
    }
  }

  return { success: true, alertsCreated };
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
