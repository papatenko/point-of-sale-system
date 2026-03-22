export async function getTrucks(db) {
  const [rows] = await db.query(`
    SELECT * FROM food_trucks ORDER BY truck_name
  `);
  return rows;
}

export async function createTruck(body, db) {
  const {
    license_plate,
    truck_name,
    current_location,
    phone_number,
    accepts_online_orders,
    operating_hours_start,
    operating_hours_end,
  } = body;

  if (!license_plate || !truck_name) {
    return {
      error: "Missing required fields: license_plate, truck_name",
    };
  }

  const [[existing]] = await db.query(
    "SELECT license_plate FROM food_trucks WHERE license_plate = ?",
    [license_plate]
  );

  if (existing) {
    return { error: "A truck with this license plate already exists" };
  }

  const [result] = await db.query(
    `INSERT INTO food_trucks 
     (license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      license_plate,
      truck_name,
      current_location || null,
      phone_number || null,
      accepts_online_orders !== undefined ? accepts_online_orders : true,
      operating_hours_start || null,
      operating_hours_end || null,
    ]
  );

  return {
    success: true,
    license_plate: result.insertId,
    message: "Truck created successfully",
  };
}

export async function updateTruck(body, db) {
  const {
    license_plate,
    truck_name,
    current_location,
    phone_number,
    accepts_online_orders,
    operating_hours_start,
    operating_hours_end,
  } = body;

  if (!license_plate) {
    return { error: "license_plate is required" };
  }

  const [[existing]] = await db.query(
    "SELECT license_plate FROM food_trucks WHERE license_plate = ?",
    [license_plate]
  );

  if (!existing) {
    return { error: "Truck not found" };
  }

  await db.query(
    `UPDATE food_trucks SET
     truck_name = COALESCE(?, truck_name),
     current_location = ?,
     phone_number = ?,
     accepts_online_orders = COALESCE(?, accepts_online_orders),
     operating_hours_start = ?,
     operating_hours_end = ?
     WHERE license_plate = ?`,
    [
      truck_name,
      current_location,
      phone_number,
      accepts_online_orders,
      operating_hours_start,
      operating_hours_end,
      license_plate,
    ]
  );

  return {
    success: true,
    message: "Truck updated successfully",
  };
}

export async function deleteTruck(body, db) {
  const { license_plate } = body;

  if (!license_plate) {
    return { error: "license_plate is required" };
  }

  const [[existing]] = await db.query(
    "SELECT license_plate FROM food_trucks WHERE license_plate = ?",
    [license_plate]
  );

  if (!existing) {
    return { error: "Truck not found" };
  }

  const [[employeeCount]] = await db.query(
    "SELECT COUNT(*) as count FROM employees WHERE license_plate = ?",
    [license_plate]
  );

  if (employeeCount.count > 0) {
    return {
      error: `Cannot delete truck: ${employeeCount.count} employee(s) are assigned to this truck`,
    };
  }

  await db.query("DELETE FROM food_trucks WHERE license_plate = ?", [license_plate]);

  return {
    success: true,
    message: "Truck deleted successfully",
  };
}
