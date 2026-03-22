import * as TruckService from "../services/trucks.service.js";

export function registerTrucksRoutes(router) {
  router.get("/api/trucks", async (_, db) => TruckService.getAllTrucks(db));
  router.post("/api/trucks", async (body, db) => TruckService.createTruck(db, body));
  router.put("/api/trucks", async (body, db) => TruckService.updateTruck(db, body));
  router.delete("/api/trucks", async (body, db) => TruckService.deleteTruck(db, body));
}
