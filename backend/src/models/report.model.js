export async function getReportStats(db) {
  const [[row]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM ingredients) AS totalIngredients,
      (SELECT COUNT(*) FROM employees) AS totalEmployees,
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM menu_items) AS totalMenuItems,
      (SELECT COUNT(*) FROM suppliers) AS totalSuppliers,
      (SELECT COUNT(*) FROM food_trucks) AS totalTrucks,
      (SELECT COUNT(*) FROM checkout) AS totalOrders,
      (SELECT COALESCE(SUM(quantity), 0) FROM order_items) AS totalItemsSold,
      (SELECT COALESCE(SUM(total_price), 0) FROM checkout WHERE order_status <> 'cancelled' AND payment_status <> 'refunded') AS grossIncome
  `);

  const [ethnicityRows] = await db.query(`
    SELECT rl.race_id AS raceId, rl.race AS race, COUNT(u.email) AS total
    FROM race_lookup rl
    LEFT JOIN users u ON u.ethnicity = rl.race_id
    GROUP BY rl.race_id, rl.race
    ORDER BY rl.race_id
  `);

  const [[{ unspecified }]] = await db.query(`
    SELECT COUNT(*) AS unspecified FROM users WHERE ethnicity IS NULL
  `);

  const [menuByCatRows] = await db.query(`
    SELECT c.category_id AS categoryId, c.category_name AS categoryName, COUNT(m.menu_item_id) AS total
    FROM menu_category_lookup c
    LEFT JOIN menu_items m ON m.category = c.category_id
    GROUP BY c.category_id, c.category_name
    ORDER BY c.category_id
  `);

  const [[menuUncat]] = await db.query(`
    SELECT COUNT(*) AS total FROM menu_items WHERE category IS NULL
  `);

  const [ingredientCatRows] = await db.query(`
    SELECT COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS categoryName, COUNT(*) AS total
    FROM ingredients
    GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized')
    ORDER BY categoryName
  `);

  const [orderTypeRows] = await db.query(`
    SELECT order_type AS categoryName, COUNT(*) AS total
    FROM checkout
    GROUP BY order_type
    ORDER BY order_type
  `);

  const [soldByCatRows] = await db.query(`
    SELECT c.category_id AS categoryId, c.category_name AS categoryName, COALESCE(SUM(oi.quantity), 0) AS total
    FROM menu_category_lookup c
    LEFT JOIN menu_items m ON m.category = c.category_id
    LEFT JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
    GROUP BY c.category_id, c.category_name
    ORDER BY c.category_id
  `);

  const [[soldUncat]] = await db.query(`
    SELECT COALESCE(SUM(oi.quantity), 0) AS total
    FROM order_items oi
    INNER JOIN menu_items m ON m.menu_item_id = oi.menu_item_id
    WHERE m.category IS NULL
  `);

  const [truckOrderRows] = await db.query(`
    SELECT ft.license_plate AS licensePlate, ft.truck_name AS truckName, COUNT(c.checkout_id) AS total
    FROM food_trucks ft
    LEFT JOIN checkout c ON c.license_plate = ft.license_plate
    GROUP BY ft.license_plate, ft.truck_name
    ORDER BY ft.license_plate
  `);

  return {
    totalIngredients: Number(row.totalIngredients) || 0,
    totalEmployees: Number(row.totalEmployees) || 0,
    totalUsers: Number(row.totalUsers) || 0,
    totalMenuItems: Number(row.totalMenuItems) || 0,
    totalSuppliers: Number(row.totalSuppliers) || 0,
    totalTrucks: Number(row.totalTrucks) || 0,
    totalOrders: Number(row.totalOrders) || 0,
    totalItemsSold: Number(row.totalItemsSold) || 0,
    grossIncome: Number(row.grossIncome) || 0,
    ethnicityByRace: ethnicityRows.map((r) => ({
      raceId: Number(r.raceId),
      race: r.race,
      total: Number(r.total) || 0,
    })),
    ethnicityUnspecified: Number(unspecified) || 0,
    menuItemsByCategory: menuByCatRows.map((r) => ({
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName,
      total: Number(r.total) || 0,
    })),
    menuItemsUncategorized: Number(menuUncat?.total) || 0,
    ingredientsByCategory: ingredientCatRows.map((r) => ({
      categoryName: r.categoryName,
      total: Number(r.total) || 0,
    })),
    ordersByCategory: orderTypeRows.map((r) => {
      const raw = String(r.categoryName || "");
      const label = raw === "walk-in" ? "Walk-in" : raw === "online-pickup" ? "Online pickup" : raw;
      return { categoryName: label, total: Number(r.total) || 0 };
    }),
    itemsSoldByCategory: soldByCatRows.map((r) => ({
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName,
      total: Number(r.total) || 0,
    })),
    itemsSoldUncategorized: Number(soldUncat?.total) || 0,
    ordersByTruck: truckOrderRows.map((r) => ({
      licensePlate: r.licensePlate,
      truckName: r.truckName,
      total: Number(r.total) || 0,
    })),
  };
}
