import * as SupplierService from "../services/suppliers.service.js";

export async function handleGetSuppliers(db) {
  return await SupplierService.getAllSuppliers(db);
}

export async function handleCreateSupplier(body, db) {
  return await SupplierService.createSupplier(db, body);
}

export async function handleDeleteSupplier(body, db) {
  return await SupplierService.deleteSupplier(db, body);
}
