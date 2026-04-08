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

/** Optional: restrict report charts to one truck (`checkout.license_plate`). */
function parseTruckFilter(url) {
  if (!url || typeof url !== "string") return null;
  const q = url.indexOf("?");
  if (q === -1) return null;
  const params = new URLSearchParams(url.slice(q));
  const raw = params.get("truck") ?? params.get("ethnicityTruck");
  if (raw == null || String(raw).trim() === "") return null;
  const licensePlate = String(raw).trim();
  if (licensePlate.length > 32) {
    return { error: "Invalid truck filter" };
  }
  return { licensePlate };
}

function parseEthnicityFilter(url) {
  if (!url || typeof url !== "string") return null;
  const q = url.indexOf("?");
  if (q === -1) return null;
  const params = new URLSearchParams(url.slice(q));
  const raw = params.get("ethnicity");
  if (raw == null || String(raw).trim() === "") return null;
  const value = String(raw).trim().toLowerCase();
  if (value === "unspecified") return { unspecified: true };
  if (!/^\d+$/.test(value)) {
    return { error: "Invalid ethnicity filter" };
  }
  return { raceId: Number(value) };
}

function parseOrderTypeFilter(url) {
  if (!url || typeof url !== "string") return null;
  const q = url.indexOf("?");
  if (q === -1) return null;
  const params = new URLSearchParams(url.slice(q));
  const raw = params.get("orderType");
  if (raw == null || String(raw).trim() === "") return null;
  const value = String(raw).trim().toLowerCase();
  const allowed = new Set(["walk-in", "online-pickup"]);
  if (!allowed.has(value)) return { error: "Invalid order type filter" };
  return { orderType: value };
}

function splitCsv(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split("||")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toDetailObjects(rows) {
  return rows
    .filter((r) => Number(r.quantity) > 0)
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))
    .map((r) => ({
      name: r.itemName,
      quantity: Number(r.quantity) || 0,
    }));
}

export async function getReportStats(db, url) {
  const range = parseReportDateRange(url);
  if (range?.error) {
    return { error: range.error };
  }

  const truckFilter = parseTruckFilter(url);
  if (truckFilter?.error) {
    return { error: truckFilter.error };
  }
  const ethnicityFilter = parseEthnicityFilter(url);
  if (ethnicityFilter?.error) {
    return { error: ethnicityFilter.error };
  }
  const orderTypeFilter = parseOrderTypeFilter(url);
  if (orderTypeFilter?.error) {
    return { error: orderTypeFilter.error };
  }

  let truckPlate = null;
  if (truckFilter?.licensePlate) {
    const [[ft]] = await db.query(
      "SELECT license_plate FROM food_trucks WHERE license_plate = ? LIMIT 1",
      [truckFilter.licensePlate],
    );
    if (!ft) {
      return { error: "Unknown food truck license plate" };
    }
    truckPlate = truckFilter.licensePlate;
  }

  const placed = checkoutPlacedAtSql("c");
  const placedCh = checkoutPlacedAtSql("ch");
  const hasEthnicityFilter = Boolean(
    ethnicityFilter?.unspecified || ethnicityFilter?.raceId != null,
  );
  const hasOrderTypeFilter = Boolean(orderTypeFilter?.orderType);
  const hasScopedOrderFilters = Boolean(
    truckPlate || range || hasEthnicityFilter || hasOrderTypeFilter,
  );
  const hasCheckoutBackedUserFilter = Boolean(truckPlate || range || hasOrderTypeFilter);

  function buildCheckoutWhere(alias) {
    const clauses = [];
    const params = [];
    const placedAlias = checkoutPlacedAtSql(alias);
    if (range) {
      clauses.push(`DATE(${placedAlias}) BETWEEN ? AND ?`);
      params.push(range.start, range.end);
    }
    if (truckPlate) {
      clauses.push(`${alias}.license_plate = ?`);
      params.push(truckPlate);
    }
    if (hasOrderTypeFilter) {
      clauses.push(`${alias}.order_type = ?`);
      params.push(orderTypeFilter.orderType);
    }
    if (hasEthnicityFilter) {
      if (ethnicityFilter.unspecified) {
        clauses.push(
          `EXISTS (SELECT 1 FROM users uf WHERE uf.email = ${alias}.customer_email AND uf.ethnicity IS NULL)`,
        );
      } else {
        clauses.push(
          `EXISTS (SELECT 1 FROM users uf WHERE uf.email = ${alias}.customer_email AND uf.ethnicity = ?)`,
        );
        params.push(ethnicityFilter.raceId);
      }
    }
    return {
      sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
  }

  const checkoutWhereC = buildCheckoutWhere("c");
  const checkoutWhereCh = buildCheckoutWhere("ch");

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

  const [ethnicityRowsRaw] = hasCheckoutBackedUserFilter
    ? await db.query(
        `
    SELECT
      rl.race_id AS raceId,
      rl.race AS race,
      (
        SELECT COUNT(DISTINCT u.email)
        FROM users u
        INNER JOIN checkout c ON c.customer_email = u.email
        ${checkoutWhereC.sql}
          ${checkoutWhereC.sql ? "AND" : "WHERE"} u.ethnicity = rl.race_id
      ) AS total
    FROM race_lookup rl
    ORDER BY rl.race_id
    `,
        checkoutWhereC.params,
      )
    : await db.query(`
    SELECT rl.race_id AS raceId, rl.race AS race, COUNT(u.email) AS total
    FROM race_lookup rl
    LEFT JOIN users u ON u.ethnicity = rl.race_id
    GROUP BY rl.race_id, rl.race
    ORDER BY rl.race_id
  `);

  const [[{ unspecified: unspecifiedRaw }]] = hasCheckoutBackedUserFilter
    ? await db.query(
        `
    SELECT COUNT(DISTINCT u.email) AS unspecified
    FROM users u
    INNER JOIN checkout c ON c.customer_email = u.email
    ${checkoutWhereC.sql}
      ${checkoutWhereC.sql ? "AND" : "WHERE"} u.ethnicity IS NULL
    `,
        checkoutWhereC.params,
      )
    : await db.query(`
    SELECT COUNT(*) AS unspecified FROM users WHERE ethnicity IS NULL
  `);

  const ethnicityRows = hasEthnicityFilter
    ? ethnicityFilter.unspecified
      ? []
      : ethnicityRowsRaw.filter((r) => Number(r.raceId) === Number(ethnicityFilter.raceId))
    : ethnicityRowsRaw;
  const unspecified = hasEthnicityFilter
    ? ethnicityFilter.unspecified
      ? Number(unspecifiedRaw) || 0
      : 0
    : Number(unspecifiedRaw) || 0;

  const [menuByCatRows] = hasScopedOrderFilters
    ? await db.query(
        `
    SELECT
      c.category_id AS categoryId,
      c.category_name AS categoryName,
      COUNT(DISTINCT m.menu_item_id) AS total,
      GROUP_CONCAT(DISTINCT m.item_name ORDER BY m.item_name SEPARATOR '||') AS details
    FROM menu_category_lookup c
    LEFT JOIN menu_items m ON m.category = c.category_id
    LEFT JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
    LEFT JOIN checkout ch ON ch.checkout_id = oi.order_id
    ${checkoutWhereCh.sql}
    GROUP BY c.category_id, c.category_name
    ORDER BY c.category_id
  `,
        checkoutWhereCh.params,
      )
    : await db.query(`
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

  const [[menuUncat]] = hasScopedOrderFilters
    ? await db.query(
        `
    SELECT COUNT(DISTINCT m.menu_item_id) AS total
    FROM menu_items m
    INNER JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
    INNER JOIN checkout ch ON ch.checkout_id = oi.order_id
    ${checkoutWhereCh.sql}
    ${checkoutWhereCh.sql ? "AND" : "WHERE"} m.category IS NULL
  `,
        checkoutWhereCh.params,
      )
    : await db.query(`
    SELECT COUNT(*) AS total FROM menu_items WHERE category IS NULL
  `);

  const [ingredientCatRows] = hasScopedOrderFilters
    ? await db.query(
        `
    SELECT
      COALESCE(NULLIF(TRIM(i.category), ''), 'Uncategorized') AS categoryName,
      COUNT(DISTINCT i.ingredient_id) AS total,
      GROUP_CONCAT(DISTINCT i.ingredient_name ORDER BY i.ingredient_name SEPARATOR '||') AS details
    FROM ingredients i
    INNER JOIN recipe_ingredient ri ON ri.ingredient_id = i.ingredient_id
    INNER JOIN order_items oi ON oi.menu_item_id = ri.menu_item_id
    INNER JOIN checkout ch ON ch.checkout_id = oi.order_id
    ${checkoutWhereCh.sql}
    GROUP BY COALESCE(NULLIF(TRIM(i.category), ''), 'Uncategorized')
    ORDER BY categoryName
  `,
        checkoutWhereCh.params,
      )
    : await db.query(`
    SELECT
      COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS categoryName,
      COUNT(*) AS total,
      GROUP_CONCAT(ingredient_name ORDER BY ingredient_name SEPARATOR '||') AS details
    FROM ingredients
    GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized')
    ORDER BY categoryName
  `);

  const orderTypeRows = (
    await db.query(
      `
      SELECT
        c.order_type AS categoryName,
        COUNT(*) AS total,
        GROUP_CONCAT(c.order_number ORDER BY c.checkout_id DESC SEPARATOR '||') AS details
      FROM checkout c
      ${checkoutWhereC.sql}
      GROUP BY c.order_type
      ORDER BY c.order_type
    `,
      checkoutWhereC.params,
    )
  )[0];

  const soldByCatRows =
    hasScopedOrderFilters
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
        ${checkoutWhereCh.sql}
      ) oi ON oi.menu_item_id = m.menu_item_id
      GROUP BY mc.category_id, mc.category_name
      ORDER BY mc.category_id
    `,
          checkoutWhereCh.params,
        )
      )[0]
    : (
        await db.query(
          `
      SELECT
        c.category_id AS categoryId,
        c.category_name AS categoryName,
        COALESCE(SUM(oi.quantity), 0) AS total,
        GROUP_CONCAT(DISTINCT m.item_name ORDER BY m.item_name SEPARATOR '||') AS details
      FROM menu_category_lookup c
      LEFT JOIN menu_items m ON m.category = c.category_id
      LEFT JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
      ${truckPlate ? "LEFT JOIN checkout ch ON ch.checkout_id = oi.order_id" : ""}
      ${truckPlate ? "WHERE ch.license_plate = ?" : ""}
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_id
    `,
          truckPlate ? [truckPlate] : [],
        )
      )[0];

  const soldUncat = hasScopedOrderFilters
    ? (
        await db.query(
          `
      SELECT COALESCE(SUM(oi.quantity), 0) AS total
      FROM order_items oi
      INNER JOIN menu_items m ON m.menu_item_id = oi.menu_item_id
      INNER JOIN checkout ch ON ch.checkout_id = oi.order_id
      ${checkoutWhereCh.sql}
      ${checkoutWhereCh.sql ? "AND" : "WHERE"} m.category IS NULL
    `,
          checkoutWhereCh.params,
        )
      )[0][0]
    : (
        await db.query(
          `
      SELECT COALESCE(SUM(oi.quantity), 0) AS total
      FROM order_items oi
      INNER JOIN menu_items m ON m.menu_item_id = oi.menu_item_id
      ${truckPlate ? "INNER JOIN checkout ch ON ch.checkout_id = oi.order_id" : ""}
      WHERE m.category IS NULL
      ${truckPlate ? "AND ch.license_plate = ?" : ""}
    `,
          truckPlate ? [truckPlate] : [],
        )
      )[0][0];

  const soldItemDetailRows = hasScopedOrderFilters
    ? (
        await db.query(
          `
      SELECT
        m.category AS categoryId,
        m.item_name AS itemName,
        COALESCE(SUM(oi.quantity), 0) AS quantity
      FROM menu_items m
      INNER JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
      INNER JOIN checkout ch ON ch.checkout_id = oi.order_id
      ${checkoutWhereCh.sql}
      GROUP BY m.category, m.menu_item_id, m.item_name
      ORDER BY m.category, quantity DESC, m.item_name
    `,
          checkoutWhereCh.params,
        )
      )[0]
    : (
        await db.query(
          `
      SELECT
        m.category AS categoryId,
        m.item_name AS itemName,
        COALESCE(SUM(oi.quantity), 0) AS quantity
      FROM menu_items m
      INNER JOIN order_items oi ON oi.menu_item_id = m.menu_item_id
      ${truckPlate ? "INNER JOIN checkout ch ON ch.checkout_id = oi.order_id" : ""}
      ${truckPlate ? "WHERE ch.license_plate = ?" : ""}
      GROUP BY m.category, m.menu_item_id, m.item_name
      ORDER BY m.category, quantity DESC, m.item_name
    `,
          truckPlate ? [truckPlate] : [],
        )
      )[0];

  const soldDetailsByCategory = new Map();
  for (const row of soldItemDetailRows) {
    const key = row.categoryId == null ? "__uncat__" : String(row.categoryId);
    const list = soldDetailsByCategory.get(key) || [];
    list.push(row);
    soldDetailsByCategory.set(key, list);
  }

  const truckOrderRows = hasScopedOrderFilters
    ? (
        await db.query(
          `
      SELECT
        ft.license_plate AS licensePlate,
        ft.truck_name AS truckName,
        COUNT(c.checkout_id) AS total,
        GROUP_CONCAT(c.order_number ORDER BY c.checkout_id DESC SEPARATOR '||') AS details
      FROM food_trucks ft
      LEFT JOIN checkout c ON c.license_plate = ft.license_plate
      ${checkoutWhereC.sql}
      GROUP BY ft.license_plate, ft.truck_name
      ORDER BY ft.license_plate
    `,
          checkoutWhereC.params,
        )
      )[0]
    : (
        await db.query(
          `
      SELECT
        ft.license_plate AS licensePlate,
        ft.truck_name AS truckName,
        COUNT(c.checkout_id) AS total,
        GROUP_CONCAT(c.order_number ORDER BY c.checkout_id DESC SEPARATOR '||') AS details
      FROM food_trucks ft
      LEFT JOIN checkout c ON c.license_plate = ft.license_plate
      ${truckPlate ? "WHERE ft.license_plate = ?" : ""}
      GROUP BY ft.license_plate, ft.truck_name
      ORDER BY ft.license_plate
    `,
          truckPlate ? [truckPlate] : [],
        )
      )[0];

  const grossIncomeRow = hasScopedOrderFilters
    ? await db.query(
        `
      SELECT COALESCE(SUM(c.total_price), 0) AS grossIncome
      FROM checkout c
      WHERE c.order_status <> 'cancelled'
        AND c.payment_status <> 'refunded'
        ${checkoutWhereC.sql ? `AND ${checkoutWhereC.sql.replace(/^WHERE\s+/i, "")}` : ""}
    `,
        checkoutWhereC.params,
      ).then((res) => res?.[0]?.[0] || { grossIncome: 0 })
    : { grossIncome: row.grossIncome };

  const filteredEmployeeTotal = truckPlate
    ? await db
        .query("SELECT COUNT(*) AS totalEmployees FROM employees WHERE license_plate = ?", [
          truckPlate,
        ])
        .then((res) => Number(res?.[0]?.[0]?.totalEmployees) || 0)
    : Number(row.totalEmployees) || 0;

  const computedTotalUsers =
    ethnicityRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0) +
    (Number(unspecified) || 0);
  const computedTotalMenuItems =
    menuByCatRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0) +
    (Number(menuUncat?.total) || 0);
  const computedTotalIngredients = ingredientCatRows.reduce(
    (sum, r) => sum + (Number(r.total) || 0),
    0,
  );
  const computedTotalOrders = orderTypeRows.reduce(
    (sum, r) => sum + (Number(r.total) || 0),
    0,
  );
  const computedTotalItemsSold =
    soldByCatRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0) +
    (Number(soldUncat?.total) || 0);

  return {
    totalIngredients: hasScopedOrderFilters
      ? computedTotalIngredients
      : Number(row.totalIngredients) || 0,
    totalEmployees: filteredEmployeeTotal,
    totalUsers: hasEthnicityFilter || hasCheckoutBackedUserFilter
      ? computedTotalUsers
      : Number(row.totalUsers) || 0,
    totalMenuItems: hasScopedOrderFilters
      ? computedTotalMenuItems
      : Number(row.totalMenuItems) || 0,
    totalSuppliers: Number(row.totalSuppliers) || 0,
    totalTrucks: hasScopedOrderFilters
      ? truckOrderRows.filter((r) => Number(r.total) > 0).length
      : Number(row.totalTrucks) || 0,
    totalOrders: hasScopedOrderFilters ? computedTotalOrders : Number(row.totalOrders) || 0,
    totalItemsSold: hasScopedOrderFilters
      ? computedTotalItemsSold
      : Number(row.totalItemsSold) || 0,
    grossIncome: Number(grossIncomeRow?.grossIncome) || 0,
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
        rawCategoryName: raw,
        categoryName: label,
        total: Number(r.total) || 0,
        details: splitCsv(r.details),
      };
    }),
    itemsSoldByCategory: soldByCatRows.map((r) => ({
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName,
      total: Number(r.total) || 0,
      details: toDetailObjects(soldDetailsByCategory.get(String(r.categoryId)) || []),
    })),
    itemsSoldUncategorized: Number(soldUncat?.total) || 0,
    itemsSoldUncategorizedDetails: toDetailObjects(
      soldDetailsByCategory.get("__uncat__") || [],
    ),
    ordersByTruck: truckOrderRows.map((r) => ({
      licensePlate: r.licensePlate,
      truckName: r.truckName,
      total: Number(r.total) || 0,
      details: splitCsv(r.details),
    })),
    filters: {
      startDate: range?.start ?? null,
      endDate: range?.end ?? null,
      orderMetricsFiltered: Boolean(range),
      truck: truckPlate,
      ethnicityTruck: truckPlate,
      ethnicity:
        ethnicityFilter?.unspecified
          ? "unspecified"
          : ethnicityFilter?.raceId != null
            ? ethnicityFilter.raceId
            : null,
      orderType: orderTypeFilter?.orderType ?? null,
      ethnicityUsesOrderDates: Boolean(truckPlate && range),
    },
  };
}
