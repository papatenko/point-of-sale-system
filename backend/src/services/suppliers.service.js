import * as SupplierModel from "../models/suppliers.model.js";

export async function getAllSuppliers(db) {
  return await SupplierModel.findAll(db);
}

export async function createSupplier(db, data) {
  const { supplier_name, contact_person, email, phone_number, address, is_reliable_supplier } = data;

  if (!supplier_name) {
    return {
      error: "Missing required field: supplier_name",
    };
  }

  const result = await SupplierModel.create(db, { 
    supplier_name, 
    contact_person, 
    email, 
    phone_number, 
    address,
    is_reliable_supplier,
  });

  return {
    success: true,
    supplier_id: result.insertId,
    message: "Supplier created successfully",
  };
}

export async function deleteSupplier(db, supplier_id) {
  if (!supplier_id) {
    return { error: "supplier_id is required" };
  }

  const result = await SupplierModel.remove(db, supplier_id);

  if (result.affectedRows === 0) {
    return { error: "Supplier not found" };
  }

  return {
    success: true,
    message: "Supplier deleted successfully",
  };
}

export async function updateSupplier(db, data) {
  const { supplier_id, supplier_name, contact_person, email, phone_number, address, is_reliable_supplier } = data;

  if (!supplier_id) {
    return { error: "supplier_id is required" };
  }

  const result = await SupplierModel.update(db, supplier_id, {
    supplier_name,
    contact_person,
    email,
    phone_number,
    address,
    is_reliable_supplier,
  });

  if (result.affectedRows === 0) {
    return { error: "Supplier not found" };
  }

  return {
    success: true,
    message: "Supplier updated successfully",
  };
}
