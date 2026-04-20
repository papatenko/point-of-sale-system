export async function findAll(db, status = "all") {
  let whereClause = "";
  if (status === "active") {
    whereClause = "WHERE is_active = 1";
  } else if (status === "inactive") {
    whereClause = "WHERE is_active = 0";
  }

  const [rows] = await db.query(`
    SELECT * FROM food_trucks
    ${whereClause}
    ORDER BY truck_name
  `);
  return rows;
}

export async function findByLicensePlate(db, licensePlate) {
  const [[row]] = await db.query(
    "SELECT license_plate FROM food_trucks WHERE license_plate = ?",
    [licensePlate]
  );
  return row;
}

// export async function create(db, data) {
//   const [result] = await db.query(
//     `INSERT INTO food_trucks 
//      (license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end)
//      VALUES (?, ?, ?, ?, ?, ?, ?)`,
//     [
//       data.license_plate,
//       data.truck_name,
//       data.current_location || null,
//       data.phone_number || null,
//       data.accepts_online_orders !== undefined ? data.accepts_online_orders : true,
//       data.operating_hours_start || null,
//       data.operating_hours_end || null,
//     ]
//   );
//   return result;
// }

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO food_trucks 
     (license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.license_plate,
      data.truck_name,
      data.current_location || null,
      data.phone_number || null,
      data.accepts_online_orders ?? true,
      data.operating_hours_start || null,
      data.operating_hours_end || null,
      data.is_active ?? true
    ]
  );
  return result;
}

// export async function update(db, licensePlate, data) {
//   await db.query(
//     `UPDATE food_trucks SET
//      truck_name = COALESCE(?, truck_name),
//      current_location = ?,
//      phone_number = ?,
//      accepts_online_orders = COALESCE(?, accepts_online_orders),
//      operating_hours_start = ?,
//      operating_hours_end = ?
//      WHERE license_plate = ?`,
//     [
//       data.truck_name,
//       data.current_location,
//       data.phone_number,
//       data.accepts_online_orders,
//       data.operating_hours_start,
//       data.operating_hours_end,
//       licensePlate,
//     ]
//   );
// }

export async function update(db, licensePlate, data) {
  await db.query(
    `UPDATE food_trucks SET
     truck_name = COALESCE(?, truck_name),
     current_location = COALESCE(?, current_location),
     phone_number = COALESCE(?, phone_number),
     accepts_online_orders = COALESCE(?, accepts_online_orders),
     operating_hours_start = COALESCE(?, operating_hours_start),
     operating_hours_end = COALESCE(?, operating_hours_end),
     is_active = ?
     WHERE license_plate = ?`,
    [
      data.truck_name,
      data.current_location,
      data.phone_number,
      data.accepts_online_orders,
      data.operating_hours_start,
      data.operating_hours_end,
      data.is_active,
      licensePlate,
    ]
  );
}

export async function remove(db, licensePlate) {
  await db.query("START TRANSACTION");

  try {
    // 1. desactivar truck
    await db.query(
      `UPDATE food_trucks 
       SET is_active = FALSE
       WHERE license_plate = ?`,
      [licensePlate]
    );

    // 2. desactivar empleados del truck
    await db.query(
      `UPDATE employees 
       SET is_active = FALSE
       WHERE license_plate = ?`,
      [licensePlate]
    );

    // 3. cancel all incomplete orders for the truck
    await db.query(
      `UPDATE checkout
       SET order_status = 'cancelled'
       WHERE license_plate = ?
         AND order_status NOT IN ('completed', 'cancelled')`,
      [licensePlate]
    );

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

export async function countEmployees(db, licensePlate) {
  const [[row]] = await db.query(
    "SELECT COUNT(*) as count FROM employees WHERE license_plate = ?",
    [licensePlate]
  );
  return row.count;
}
