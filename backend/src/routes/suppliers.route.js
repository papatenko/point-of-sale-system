import * as SupplierService from "../services/suppliers.service.js";

export function registerSuppliersRoutes(router) {
  router.get("/api/suppliers", async (_, db) => SupplierService.getAllSuppliers(db));
  router.post("/api/suppliers", async (body, db) => SupplierService.createSupplier(db, body));
  router.delete("/api/suppliers", async (body, db) => SupplierService.deleteSupplier(db, body));
}
