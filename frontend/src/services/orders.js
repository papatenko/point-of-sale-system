import { apiFetch } from "./api";

export async function getOrders(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiFetch(`/api/orders?${queryString}`);
}

export async function getOrder(orderId) {
  return apiFetch(`/api/orders/${orderId}`);
}

export async function updateOrderStatus(orderId, status) {
  return apiFetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createCheckout(orderData) {
  return apiFetch("/api/checkout", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}
