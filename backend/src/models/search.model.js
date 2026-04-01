// export async function searchTable(db, table, columns, term, extra = "") {
//   const like = `%${term}%`;

//   const where = columns
//     .map((col) => `${col} LIKE ?`)
//     .join(" OR ");

//   const values = columns.map(() => like);

//   const query = `
//     SELECT *
//     FROM ${table}
//     ${extra}
//     WHERE ${where}
//   `;

//   const [rows] = await db.query(query, values);

//   return rows;
// }

// recibe: db, table, columnas, término, extra (JOIN)
export async function searchTable(db, table, columns, term, extra = "") {
  const cols = columns.join(", "); // "item_name, description, c.category_name"
  
  const [rows] = await db.query(`
    SELECT ${cols}
    FROM ${table}
    ${extra}
    WHERE ${columns
      .map((c) => `${c} LIKE ?`)
      .join(" OR ")}
  `, Array(columns.length).fill(`%${term}%`));
  
  return rows;
}