import * as OrdersController from "../controllers/orders.controller.js";

export function registerOrdersRoutes(router) {
  router.get("/api/orders/:id", async (body, db, url) => OrdersController.handleGetOrder(body, db, url));
}
