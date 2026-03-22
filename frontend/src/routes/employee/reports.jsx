import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/employee/reports")({
  component: RouteComponent,
});

function RouteComponent() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/reports/stats", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load stats");
        setStats(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const money = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  return (
    <div style={{ padding: "20px" }}>
      <div>Reports Dashboard</div>

      {error && (
        <p style={{ color: "crimson", marginTop: "12px" }}>{error}</p>
      )}
      {loading && <p style={{ marginTop: "12px" }}>Loading…</p>}

      <div style={{ marginTop: "20px" }}>
        <div>Total Ingredients: {stats?.totalIngredients ?? "—"}</div>
        <div>Total Employees: {stats?.totalEmployees ?? "—"}</div>
        <div>Total Items on Menu: {stats?.totalMenuItems ?? "—"}</div>
        <div>Total Suppliers: {stats?.totalSuppliers ?? "—"}</div>
        <div>Total Trucks: {stats?.totalTrucks ?? "—"}</div>
        <div>Total Orders: {stats?.totalOrders ?? "—"}</div>
        <div>Total Items Sold: {stats?.totalItemsSold ?? "—"}</div>
        <div>Gross Income: ${stats != null ? money(stats.grossIncome) : "—"}</div>
      </div>
    </div>
  );
}
