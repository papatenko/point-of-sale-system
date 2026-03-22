import * as TruckModel from "../database/models/trucks.model.js";

export async function getAllTrucks(db) {
  return await TruckModel.findAll(db);
}

export async function createTruck(db, data) {
  const { license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end } = data;

  if (!license_plate || !truck_name) {
    return {
      error: "Missing required fields: license_plate, truck_name",
    };
  }

  const existing = await TruckModel.findByLicensePlate(db, license_plate);
  if (existing) {
    return { error: "A truck with this license plate already exists" };
  }

  const result = await TruckModel.create(db, { license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end });

  return {
    success: true,
    license_plate: result.insertId,
    message: "Truck created successfully",
  };
}

export async function updateTruck(db, data) {
  const { license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end } = data;

  if (!license_plate) {
    return { error: "license_plate is required" };
  }

  const existing = await TruckModel.findByLicensePlate(db, license_plate);
  if (!existing) {
    return { error: "Truck not found" };
  }

  await TruckModel.update(db, license_plate, { truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end });

  return {
    success: true,
    message: "Truck updated successfully",
  };
}

export async function deleteTruck(db, data) {
  const { license_plate } = data;

  if (!license_plate) {
    return { error: "license_plate is required" };
  }

  const existing = await TruckModel.findByLicensePlate(db, license_plate);
  if (!existing) {
    return { error: "Truck not found" };
  }

  const employeeCount = await TruckModel.countEmployees(db, license_plate);
  if (employeeCount > 0) {
    return {
      error: `Cannot delete truck: ${employeeCount} employee(s) are assigned to this truck`,
    };
  }

  await TruckModel.remove(db, license_plate);

  return {
    success: true,
    message: "Truck deleted successfully",
  };
}
