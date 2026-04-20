import { apiFetch } from "./api";

export async function getTrucks() {
  return apiFetch("/api/trucks?status=active");
}

export async function getTruck(licensePlate) {
  return apiFetch(`/api/trucks/${licensePlate}`);
}

export async function createTruck(data) {
  return apiFetch("/api/trucks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTruck(licensePlate, data) {
  return apiFetch(`/api/trucks/${licensePlate}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTruck(licensePlate) {
  return apiFetch(`/api/trucks/${licensePlate}`, {
    method: "DELETE",
  });
}
