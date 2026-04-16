export async function searchTable(db, table, columns, term, extra = "", where = "") {
  const cols = columns.join(", ");
  const searchConditions = columns.map((c) => `${c} LIKE ?`).join(" OR ");
  const whereClause = where ? `AND ${where}` : "";

  const [rows] = await db.query(`
    SELECT ${cols}
    FROM ${table}
    ${extra}
    WHERE ${searchConditions} ${whereClause}
  `, Array(columns.length).fill(`%${term}%`));

  return rows;
}