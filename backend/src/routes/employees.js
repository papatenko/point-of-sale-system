export async function getEmployees(db) {
  const [rows] = await db.query(`
    SELECT e.*, u.first_name, u.last_name, u.email as user_email
    FROM employees e
    JOIN users u ON e.email = u.email
    ORDER BY u.last_name, u.first_name
  `);
  // Return raw rows; the HTTP server will JSON.stringify once.
  return rows;
}

export async function deleteEmployee(body, db) {
  const { email } = body;

  if (!email) {
    return { error: "email is required" };
  }

  const [[existing]] = await db.query(
    "SELECT email FROM employees WHERE email = ?",
    [email]
  );

  if (!existing) {
    return { error: "Employee not found" };
  }

  await db.query("DELETE FROM employees WHERE email = ?", [email]);

  await db.query("DELETE FROM users WHERE email = ?", [email]);

  return {
    success: true,
    message: "Employee and associated user deleted successfully",
  };
}
