export async function getTrucks(db) {
  const [rows] = await db.query(`
      SELECT license_plate, truck_name, current_location
      FROM food_trucks
      ORDER BY truck_name
    `);
  return rows;
}
