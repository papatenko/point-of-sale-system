import * as OrdersService from "../services/orders.service.js";

export async function handleGetOrder(body, db, url) {
  return await OrdersService.getOrderById(db, url);
}
