import * as TruckController from "../controllers/trucks.controller.js";

export function registerTrucksRoutes(router) {
  router.get("/api/trucks", async (_, db) => TruckController.handleGetTrucks(db));
  router.post("/api/trucks", async (body, db) => TruckController.handleCreateTruck(body, db));
  router.put("/api/trucks", async (body, db) => TruckController.handleUpdateTruck(body, db));
  router.delete("/api/trucks", async (body, db) => TruckController.handleDeleteTruck(body, db));
}
