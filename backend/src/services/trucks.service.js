import * as TruckModel from "../models/trucks.model.js";
import * as EmployeeModel from "../models/employees.model.js";
import { verifyToken } from "../auth/jwt.js";

export async function getAllTrucks(db) {
  return await TruckModel.findAll(db);
}

export async function createTruck(db, data) {
  const { license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end, is_active } = data;

  if (!license_plate || !truck_name) {
    return {
      error: "Missing required fields: license_plate, truck_name",
    };
  }

  const existing = await TruckModel.findByLicensePlate(db, license_plate);
  if (existing) {
    return { error: "A truck with this license plate already exists" };
  }

  const result = await TruckModel.create(db, { license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end, is_active });

  return {
    success: true,
    license_plate: result.insertId,
    message: "Truck created successfully",
  };
}

export async function updateTruck(db, data) {
  const { license_plate, truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end, is_active } = data;

  if (!license_plate) {
    return { error: "license_plate is required" };
  }

  const existing = await TruckModel.findByLicensePlate(db, license_plate);
  if (!existing) {
    return { error: "Truck not found" };
  }
 
   if (is_active === false) {
    await TruckModel.remove(db, license_plate);
    return {
      success: true,
      message: "Truck deactivated successfully",
    };
  }

  await TruckModel.update(db, license_plate, { truck_name, current_location, phone_number, accepts_online_orders, operating_hours_start, operating_hours_end, is_active });

  return {
    success: true,
    message: "Truck updated successfully",
  };
}

// export async function deleteTruck(db, license_plate) {
//   if (!license_plate) {
//     return { error: "license_plate is required" };
//   }

//   const existing = await TruckModel.findByLicensePlate(db, license_plate);
//   if (!existing) {
//     return { error: "Truck not found" };
//   }

//   const employeeCount = await TruckModel.countEmployees(db, license_plate);
//   if (employeeCount > 0) {
//     return {
//       error: `Cannot delete truck: ${employeeCount} employee(s) are assigned to this truck`,
//     };
//   }

//   await TruckModel.remove(db, license_plate);

//   return {
//     success: true,
//     message: "Truck deleted successfully",
//   };
// }

export async function deleteTruck(db, license_plate) {
  if (!license_plate) {
    return { error: "license_plate is required" };
  }

  const existing = await TruckModel.findByLicensePlate(db, license_plate);
  if (!existing) {
    return { error: "Truck not found" };
  }

  await TruckModel.remove(db, license_plate);

  return {
    success: true,
    message: "Truck deactivated successfully",
  };
}

// Get the truck for the current user (manager/employee)
export async function getTruckForUser(db, req) {
  const authHeader = req?.headers?.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);
  if (!payload || !payload.email) return { error: "Unauthorized" };
  const emp = await EmployeeModel.findByEmail(db, payload.email);
  if (!emp || !emp.license_plate) return { error: "No truck assigned to this user" };
  const truck = await TruckModel.findByLicensePlate(db, emp.license_plate);
  if (!truck) return { error: "Truck not found" };
  return truck;
}
