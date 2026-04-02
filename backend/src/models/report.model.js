/** SQL expression for when an order was placed (scheduled_time, or parsed from ORD-<ms> order_number). */
export function checkoutPlacedAtSql(alias = "c") {
  return `COALESCE(
    ${alias}.scheduled_time,
    CASE
      WHEN ${alias}.order_number LIKE 'ORD-%' AND CHAR_LENGTH(SUBSTRING(${alias}.order_number, 5)) >= 10
      THEN FROM_UNIXTIME(CAST(SUBSTRING(${alias}.order_number, 5) AS UNSIGNED) / 1000)
      ELSE NULL
    END
  )`;
}

export function parseReportDateRange(url) {
  if (!url || typeof url !== "string") return null;
  const q = url.indexOf("?");
  if (q === -1) return null;
  const params = new URLSearchParams(url.slice(q));
  const start = params.get("start") || params.get("from");
  const end = params.get("end") || params.get("to");
  if (!start && !end) return null;
  if (!start || !end) {
    return {
      error:
        "Provide both start and end dates (YYYY-MM-DD) to filter order-based metrics.",
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { error: "Invalid date format. Use YYYY-MM-DD." };
  }
  if (start > end) {
    return { error: "Start date must be on or before end date." };
  }
  return { start, end };
}

function splitCsv(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split("||")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function getReportStats(db, url) {
  const range = parseReportDateRange(url);
  if (range?.error) {
    return { error: range.error };
  }

  const placed = checkoutPlacedAtSql("c");
  const placedCh = checkoutPlacedAtSql("ch");

  const [[row]] = await db.query(
    range
      ? `
    SELECT
      (SELECT COUNT(*) FROM ingredients) AS totalIngredients,
      (SELECT COUNT(*) FROM employees) AS totalEmployees,
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM menu_items) AS totalMenuItems,
      (SELECT COUNT(*) FROM suppliers) AS totalSuppliers,
      (SELECT COUNT(*) FROM food_trucks) AS totalTrucks,
      (SELECT COUNT(*) FROM checkout c WHERE DATE(${placed}) BETWEEN ? AND ?) AS totalOrders,
      (
        SELECT COALESCE(SUM(oi.quantity), 0)
        FROM order_items oi
        INNER JOIN checkout c ON c.checkout_id = oi.order_id
        WHERE DATE(${placed}) BETWEEN ? AND ?
      ) AS totalItemsSold,
      (
        SELECT COALESCE(SUM(c.total_price), 0)
        FROM checkout c
        WHERE c.order_status <> 'cancelled'
          AND c.payment_status <> 'refunded'
          AND DATE(${placed}) BETWEEN ? AND ?
      ) AS grossIncome
    `
      : `
    SELECT
      (SELECT COUNT(*) FROM ingredients) AS totalIngredients,
      (SELECT COUNT(*) FROM employees) AS totalEmployees,
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM menu_items) AS totalMenuItems,
      (SELECT COUNT(*) FROM suppliers) AS totalSuppliers,
      (SELECT COUNT(*) FROM food_trucks) AS totalTrucks,
      (SELECT COUNT(*) FROM checkout) AS totalOrders,
      (SELECT COALESCE(SUM(quantity), 0) FROM order_items) AS totalItemsSold,
      (
        SELECT COALESCE(SUM(total_price), 0)
        FROM checkout
        WHERE order_status <> 'cancelled' AND payment_status <> 'refunded'
      ) AS grossIncome
    `,
    range ? [range.start, range.end, range.start, range.end, range.start, range.end] : [],
  );

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
    SELECT
      c.category_id AS categoryId,
      c.category_name AS categoryName,
      COUNT(m.menu_item_id) AS total,
      GROUP_CONCAT(m.item_name ORDER BY m.item_name SEPARATOR '||') AS details
    FROM menu_category_lookup c
    LEFT JOIN menu_items m ON m.category = c.category_id
    GROUP BY c.category_id, c.category_name
    ORDER BY c.category_id
  `);

  const [[menuUncat]] = await db.query(`
    SELECT COUNT(*) AS total FROM menu_items WHERE category IS NULL
  `);

  const [ingredientCatRows] = await db.query(`
    SELECT
      COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS categoryName,
      COUNT(*) AS total,
      GROUP_CONCAT(ingredient_name ORDER BY ingredient_name SEPARATOR '||') AS details
    FROM ingredients
    GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized')
    ORDER BY categoryName
  `);

  const orderTypeRows = range
    ? (
        await db.query(
          `
      SELECT
        order_type AS categoryName,
        COUNT(*) AS total,
        GROUP_CONCAT(order_number ORDER BY checkout_id DESC SEPARATOR '||') AS details
      FROM checkout c
      WHERE DATE(${placed}) BETWEEN ? AND ?
      GROUP BY order_type
      ORDER BY order_type
    `,
          [range.start, range.end],
        )
      )[0]
    : (
        await db.query(`
      SELECT
        order_type AS categoryName,
        COUNT(*) AS total,
        GROUP_CONCAT(order_number ORDER BY checkout_id DESC SEPARATOR '||') AS details
      FROM checkout
      GROUP BY order_type
      ORDER BY order_type
    `)
      )[0];

  const soldByCatRows = range
    ? (
        await db.query(
          `
      SELECT
        mc.category_id AS categoryId,
        mc.category_name AS categoryName,
        COALESCE(SUM(oi.quantity), 0) AS total,
        GROUP_CONCAT(DISTINCT m.item_name ORDER BY m.item_name SEPARATOR '||') AS details
      FROM menu_category_lookup mc
      LEFT JOIN menu_items m ON m.category = mc.category_id
      LEFT JOIN (
        SELECT oi.menu_item_id, oi.quantity
        FROM order_items oi
        INNER JOIN checkout ch ON ch.checkout_id = oi.order_id
        WHERE DATE(${placedCh}) BETWEEN ? AND ?
      ) oi ON oi.menu_item_id = m.menu_item_id
      GROUP BY mc.category_id, mc.category_name
      ORDER BY mc.category_id
    `,
          [range.start, range.end],
        )
      )[0]
    : (
        await db.query(`
      SELECT
        c.category_id AS categoryId,
        c.category_name AS categoryName,
        COALESCE(SUM(oi.quantity), 0) AS total,
        GROUP_CONCAT(DISTINCT m.item_name ORDER BY m.item_name SEPARATOR '||') AS details
      FROM menu_category_lookup c
      LEFT JOIN menu_items m ON m.category = c.category_id
      LEFT JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_id
    `)
      )[0];

  const soldUncat = range
    ? (
        await db.query(
          `
      SELECT COALESCE(SUM(oi.quantity), 0) AS total
      FROM order_items oi
      INNER JOIN menu_items m ON m.menu_item_id = oi.menu_item_id
      INNER JOIN checkout ch ON ch.checkout_id = oi.order_id
      WHERE m.category IS NULL AND DATE(${placedCh}) BETWEEN ? AND ?
    `,
          [range.start, range.end],
        )
      )[0][0]
    : (
        await db.query(`
      SELECT COALESCE(SUM(oi.quantity), 0) AS total
      FROM order_items oi
      INNER JOIN menu_items m ON m.menu_item_id = oi.menu_item_id
      WHERE m.category IS NULL
    `)
      )[0][0];

  const truckOrderRows = range
    ? (
        await db.query(
          `
      SELECT
        ft.license_plate AS licensePlate,
        ft.truck_name AS truckName,
        COUNT(c.checkout_id) AS total,
        GROUP_CONCAT(c.order_number ORDER BY c.checkout_id DESC SEPARATOR '||') AS details
      FROM food_trucks ft
      LEFT JOIN checkout c ON c.license_plate = ft.license_plate AND DATE(${placed}) BETWEEN ? AND ?
      GROUP BY ft.license_plate, ft.truck_name
      ORDER BY ft.license_plate
    `,
          [range.start, range.end],
        )
      )[0]
    : (
        await db.query(`
      SELECT
        ft.license_plate AS licensePlate,
        ft.truck_name AS truckName,
        COUNT(c.checkout_id) AS total,
        GROUP_CONCAT(c.order_number ORDER BY c.checkout_id DESC SEPARATOR '||') AS details
      FROM food_trucks ft
      LEFT JOIN checkout c ON c.license_plate = ft.license_plate
      GROUP BY ft.license_plate, ft.truck_name
      ORDER BY ft.license_plate
    `)
      )[0];

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
      details: splitCsv(r.details),
    })),
    menuItemsUncategorized: Number(menuUncat?.total) || 0,
    ingredientsByCategory: ingredientCatRows.map((r) => ({
      categoryName: r.categoryName,
      total: Number(r.total) || 0,
      details: splitCsv(r.details),
    })),
    ordersByCategory: orderTypeRows.map((r) => {
      const raw = String(r.categoryName || "");
      const label =
        raw === "walk-in"
          ? "Walk-in"
          : raw === "online-pickup"
            ? "Online pickup"
            : raw;
      return {
        categoryName: label,
        total: Number(r.total) || 0,
        details: splitCsv(r.details),
      };
    }),
    itemsSoldByCategory: soldByCatRows.map((r) => ({
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName,
      total: Number(r.total) || 0,
      details: splitCsv(r.details),
    })),
    itemsSoldUncategorized: Number(soldUncat?.total) || 0,
    ordersByTruck: truckOrderRows.map((r) => ({
      licensePlate: r.licensePlate,
      truckName: r.truckName,
      total: Number(r.total) || 0,
      details: splitCsv(r.details),
    })),
    filters: range
      ? {
          startDate: range.start,
          endDate: range.end,
          orderMetricsFiltered: true,
        }
      : {
          startDate: null,
          endDate: null,
          orderMetricsFiltered: false,
        },
  };
}
