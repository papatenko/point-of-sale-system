export async function findAll(db) {
  const [rows] = await db.query(`
    SELECT * FROM food_trucks ORDER BY truck_name
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

export async function create(db, data) {
  const [result] = await db.query(
    `INSERT INTO food_trucks 
     (license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.license_plate,
      data.truck_name,
      data.current_location || null,
      data.phone_number || null,
      data.accepts_online_orders !== undefined ? data.accepts_online_orders : true,
      data.operating_hours_start || null,
      data.operating_hours_end || null,
    ]
  );
  return result;
}

export async function update(db, licensePlate, data) {
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
      data.truck_name,
      data.current_location,
      data.phone_number,
      data.accepts_online_orders,
      data.operating_hours_start,
      data.operating_hours_end,
      licensePlate,
    ]
  );
}

export async function remove(db, licensePlate) {
  await db.query("DELETE FROM food_trucks WHERE license_plate = ?", [licensePlate]);
}

export async function countEmployees(db, licensePlate) {
  const [[row]] = await db.query(
    "SELECT COUNT(*) as count FROM employees WHERE license_plate = ?",
    [licensePlate]
  );
  return row.count;
}
