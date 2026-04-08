import * as IngredientModel from "../models/ingredients.model.js";

const VALID_UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "pcs"];

export async function getAllIngredients(db) {
  return await IngredientModel.findAll(db);
}

export async function createIngredient(db, data) {
  const { ingredient_name, category, unit_of_measure, current_unit_cost, storage_time, preferred_supplier_id } = data;

  if (!ingredient_name || !unit_of_measure || !current_unit_cost) {
    return {
      error: "Missing required fields: ingredient_name, unit_of_measure, current_unit_cost",
    };
  }

  if (!VALID_UNITS.includes(unit_of_measure)) {
    return {
      error: `Invalid unit_of_measure. Must be one of: ${VALID_UNITS.join(", ")}`,
    };
  }

  const result = await IngredientModel.create(db, { ingredient_name, category, unit_of_measure, current_unit_cost, storage_time, preferred_supplier_id });

  return {
    success: true,
    ingredient_id: result.insertId,
    message: "Ingredient created successfully",
  };
}

export async function deleteIngredient(db, ingredient_id) {
  if (!ingredient_id) {
    return { error: "ingredient_id is required" };
  }

  const result = await IngredientModel.remove(db, ingredient_id);

  if (result.affectedRows === 0) {
    return { error: "Ingredient not found" };
  }

  return {
    success: true,
    message: "Ingredient deleted successfully",
  };
}

export async function updateIngredient(db, data) {
  const { ingredient_id, ingredient_name, category, unit_of_measure, current_unit_cost, storage_time, preferred_supplier_id } = data;

  if (!ingredient_id || !ingredient_name || !unit_of_measure || !current_unit_cost) {
    return {
      error: "Missing required fields: ingredient_id, ingredient_name, unit_of_measure, current_unit_cost",
    };
  }

  if (!VALID_UNITS.includes(unit_of_measure)) {
    return {
      error: `Invalid unit_of_measure. Must be one of: ${VALID_UNITS.join(", ")}`,
    };
  }

  const result = await IngredientModel.update(db, { ingredient_id, ingredient_name, category, unit_of_measure, current_unit_cost, storage_time, preferred_supplier_id });

  if (result.affectedRows === 0) {
    return { error: "Ingredient not found" };
  }

  return {
    success: true,
    message: "Ingredient updated successfully",
  };
}
