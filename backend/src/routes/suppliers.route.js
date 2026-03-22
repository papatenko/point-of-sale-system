import * as SupplierController from "../controllers/suppliers.controller.js";

export function registerSuppliersRoutes(router) {
  router.get("/api/suppliers", async (_, db) => SupplierController.handleGetSuppliers(db));
  router.post("/api/suppliers", async (body, db) => SupplierController.handleCreateSupplier(body, db));
  router.delete("/api/suppliers", async (body, db) => SupplierController.handleDeleteSupplier(body, db));
}
