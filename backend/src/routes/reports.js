/**
 * Aggregate dashboard stats for the reports screen.
 * Returns plain objects (server.js JSON.stringify's once).
 */
export async function getReportStats(db) {
  const [[row]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM ingredients) AS totalIngredients,
      (SELECT COUNT(*) FROM employees) AS totalEmployees,
      (SELECT COUNT(*) FROM menu_items) AS totalMenuItems,
      (SELECT COUNT(*) FROM suppliers) AS totalSuppliers,
      (SELECT COUNT(*) FROM food_trucks) AS totalTrucks,
      (SELECT COUNT(*) FROM checkout) AS totalOrders,
      (SELECT COALESCE(SUM(quantity), 0) FROM order_items) AS totalItemsSold,
      (
        SELECT COALESCE(SUM(total_price), 0)
        FROM checkout
        WHERE payment_status = 'completed'
      ) AS grossIncome
  `);

  // MySQL may return DECIMAL as string; normalize for JSON consumers
  return {
    totalIngredients: Number(row.totalIngredients) || 0,
    totalEmployees: Number(row.totalEmployees) || 0,
    totalMenuItems: Number(row.totalMenuItems) || 0,
    totalSuppliers: Number(row.totalSuppliers) || 0,
    totalTrucks: Number(row.totalTrucks) || 0,
    totalOrders: Number(row.totalOrders) || 0,
    totalItemsSold: Number(row.totalItemsSold) || 0,
    grossIncome: Number(row.grossIncome) || 0,
  };
}
