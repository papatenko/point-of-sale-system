import { apiFetch } from "./api";

export async function login(email, password) {
  return apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(userData) {
  return apiFetch("/api/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function getCurrentUser() {
  return apiFetch("/api/me");
}

export async function updateProfile(data) {
  return apiFetch("/api/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
export async function deleteUser(email) {
  return apiFetch(`/api/users/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}

export async function deleteCustomer(email) {
  return apiFetch(`/api/customers/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}