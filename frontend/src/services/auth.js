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

// Para usuarios normales (soft delete en users)
export async function deleteUser(email) {
  return apiFetch(`/api/users/${email}`, {
    method: "DELETE",
  });
}
// Para empleados (soft delete con is_active = 0)
export async function deleteEmployee(email) {
  return apiFetch(`/api/employees/${email}`, {
    method: "DELETE",
  });
}

// Para clientes (soft delete vía user_type = NULL)
export async function deleteCustomer(email) {
  return apiFetch(`/api/customers/${email}`, {
    method: "DELETE",
  });
}