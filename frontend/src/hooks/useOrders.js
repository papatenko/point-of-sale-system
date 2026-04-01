import { useState, useEffect, useCallback } from "react";

export function useOrders({ token = null, selectedTruck = null } = {}) {
  const [currentOrders, setCurrentOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchCurrentOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "pending,preparing,ready" });
      if (selectedTruck) params.set("truck", selectedTruck);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers });
      const data = await res.json();
      setCurrentOrders(Array.isArray(data) ? data : []);
    } catch {
      setCurrentOrders([]);
    }
  }, [token, selectedTruck]);

  const fetchPastOrders = useCallback(async (q = "") => {
    try {
      const params = new URLSearchParams({ status: "completed,cancelled" });
      if (q) params.set("search", q);
      if (selectedTruck) params.set("truck", selectedTruck);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers });
      const data = await res.json();
      setPastOrders(Array.isArray(data) ? data : []);
    } catch {
      setPastOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedTruck]);

  useEffect(() => {
    fetchCurrentOrders();
    fetchPastOrders();
  }, [fetchCurrentOrders, fetchPastOrders]);

  useEffect(() => {
    const id = setInterval(fetchCurrentOrders, 10_000);
    return () => clearInterval(id);
  }, [fetchCurrentOrders]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPastOrders(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchPastOrders]);

  return {
    currentOrders,
    pastOrders,
    search,
    setSearch,
    loading,
    refreshCurrent: fetchCurrentOrders,
    refreshPast: () => fetchPastOrders(search),
  };
}
