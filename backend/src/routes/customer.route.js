// import * as CustomerService from "../services/customers.service.js";
import * as CustomerService from "../services/customer.service.js";

export function registerCustomersRoutes(router) {
  router.get("/api/customers", async (_, db) => {
    console.log("GET /api/customers called");
    const result = await CustomerService.getAllCustomers(db);
    console.log("Result to return:", result);
    return JSON.stringify(result);
  });

  router.post("/api/customers", async (body, db) =>
    CustomerService.createCustomer(db, body)
  );

  router.delete("/api/customers", async (body, db) =>
    CustomerService.deleteCustomer(db, body)
  );

  router.get("/api/customers/raw", async (_, db) => {
    console.log("Raw customers route hit!");
    try {
      const [rows] = await db.query(`
        SELECT 
          c.email,
          c.default_address,
          u.first_name,
          u.last_name,
          u.phone_number
        FROM customers c
        JOIN users u ON c.email = u.email
        LIMIT 5
      `);
      console.log("Raw query result:", rows);
      return JSON.stringify({ success: true, count: rows.length, data: rows });
    } catch (error) {
      console.error("Raw query error:", error);
      return JSON.stringify({ success: false, error: error.message });
    }
  });
}



