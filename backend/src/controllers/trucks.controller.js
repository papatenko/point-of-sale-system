import * as TruckService from "../services/trucks.service.js";

export async function handleGetTrucks(db) {
  return await TruckService.getAllTrucks(db);
}

export async function handleCreateTruck(body, db) {
  return await TruckService.createTruck(db, body);
}

export async function handleUpdateTruck(body, db) {
  return await TruckService.updateTruck(db, body);
}

export async function handleDeleteTruck(body, db) {
  return await TruckService.deleteTruck(db, body);
}
