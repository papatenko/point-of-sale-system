import { searchTable } from "../models/search.model.js";
import leven from "leven";

// tablas permitidas
const config = {

 menu_items: {
    columns: ["item_name", "description", "c.category_name"], 
    extra: `
      LEFT JOIN menu_category_lookup c
      ON menu_items.category = c.category_id
    `,
  },
   employees: {
    columns: ["email", "role", "license_plate"],
  },

  ingredients: {
    columns: ["ingredient_name", "category", "unit_of_measure"],
  },

  food_trucks: {
    columns: ["truck_name", "current_location", "phone_number"],
  },

  truck_inventory: {
    columns: ["license_plate", "quantity_on_hand"],
    extra: `
      LEFT JOIN ingredients i
      ON truck_inventory.ingredient_id = i.ingredient_id
    `,
  },

  checkout: {
    columns: ["order_number", "order_type", "order_status", "customer_email"],
    extra: `
      LEFT JOIN food_trucks t
      ON checkout.license_plate = t.license_plate
      LEFT JOIN users u
      ON checkout.customer_email = u.email
    `,
  },
};

export async function search(db, table, term) {
  const tableConfig = config[table];
  if (!tableConfig) throw new Error("Invalid table");

  //  SQL search
  let rows = await searchTable(
    db,
    table,
    tableConfig.columns,
    term,
    tableConfig.extra || ""
  );

  // Asegurar que sea array
  if (!Array.isArray(rows)) rows = [];

  // FUZZY MATCH
  const fuzzy = rows.filter((row) =>
    Object.values(row).some((val) => {
      if (typeof val !== "string") return false;
      const distance = leven(val.toLowerCase(), term.toLowerCase());
      return distance <= 3; 
    })
  );

  // combinar resultados y quitar duplicados
  const all = [...rows, ...fuzzy];
  const unique = Array.from(
    new Map(all.map((i) => [JSON.stringify(i), i])).values()
  );

  return unique;
}