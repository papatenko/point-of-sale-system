export async function getEmployees(db) {
  const [rows] = await db.query(`
    SELECT e.*, u.first_name, u.last_name, u.email as user_email
    FROM employees e
    JOIN users u ON e.email = u.email
    ORDER BY u.last_name, u.first_name
  `);
  return JSON.stringify(rows);
}

export async function deleteEmployee(body, db) {
  const { email } = body;

  if (!email) {
    return JSON.stringify({ error: "email is required" });
  }

  const [result] = await db.query(
    "DELETE FROM employees WHERE email = ?",
    [email]
  );

  if (result.affectedRows === 0) {
    return JSON.stringify({ error: "Employee not found" });
  }

  return JSON.stringify({
    success: true,
    message: "Employee deleted successfully",
  });
}
