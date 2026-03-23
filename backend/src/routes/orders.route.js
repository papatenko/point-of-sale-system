import * as OrdersService from "../services/orders.service.js";

export function registerOrdersRoutes(router) {
  router.get("/api/orders", async (body, db, url) => OrdersService.listOrders(db, url));
  router.get("/api/orders/:id", async (body, db, url) => OrdersService.getOrderById(db, url));
}
