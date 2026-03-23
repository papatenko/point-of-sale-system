import * as CustomerService from "../services/customers.service.js";

export function registerCustomersRoutes(router) {
  router.get("/api/customers", async (_, db) =>
    CustomerService.getAllCustomers(db)
  );

  router.post("/api/customers", async (body, db) =>
    CustomerService.createCustomer(db, body)
  );

  router.delete("/api/customers", async (body, db) =>
    CustomerService.deleteCustomer(db, body)
  );
}