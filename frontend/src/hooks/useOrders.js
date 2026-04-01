import { useState, useEffect, useCallback } from "react";

export function useOrders({ token = null, selectedTruck = null } = {}) {
  const [currentOrders, setCurrentOrders] = useState([]);
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Past orders filters
  const today = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState(today);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCancelled, setShowCancelled] = useState(true);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchCurrentOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "preparing,ready" });
      if (selectedTruck) params.set("truck", selectedTruck);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers });
      const data = await res.json();
      setCurrentOrders(Array.isArray(data) ? data : []);
    } catch {
      setCurrentOrders([]);
    }
  }, [token, selectedTruck]);

  const fetchScheduledOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "pending" });
      if (selectedTruck) params.set("truck", selectedTruck);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers });
      const data = await res.json();
      setScheduledOrders(Array.isArray(data) ? data : []);
    } catch {
      setScheduledOrders([]);
    }
  }, [token, selectedTruck]);

  const fetchPastOrders = useCallback(async (q = "", date = today, completed = true, cancelled = true) => {
    try {
      const statuses = [
        ...(completed ? ["completed"] : []),
        ...(cancelled ? ["cancelled"] : []),
      ];
      if (statuses.length === 0) {
        setPastOrders([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ status: statuses.join(",") });
      if (q) params.set("search", q);
      if (date) params.set("date", date);
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
    fetchScheduledOrders();
    fetchPastOrders(search, filterDate, showCompleted, showCancelled);
  }, [fetchCurrentOrders, fetchScheduledOrders, fetchPastOrders]);

  // Auto-refresh current + scheduled orders every 10s
  useEffect(() => {
    const id = setInterval(() => {
      fetchCurrentOrders();
      fetchScheduledOrders();
    }, 10_000);
    return () => clearInterval(id);
  }, [fetchCurrentOrders, fetchScheduledOrders]);

  // Re-fetch past orders when search/filters change
  useEffect(() => {
    const timer = setTimeout(
      () => fetchPastOrders(search, filterDate, showCompleted, showCancelled),
      300
    );
    return () => clearTimeout(timer);
  }, [search, filterDate, showCompleted, showCancelled, fetchPastOrders]);

  return {
    currentOrders,
    scheduledOrders,
    pastOrders,
    search, setSearch,
    filterDate, setFilterDate,
    showCompleted, setShowCompleted,
    showCancelled, setShowCancelled,
    loading,
    refreshCurrent: () => { fetchCurrentOrders(); fetchScheduledOrders(); },
    refreshPast: () => fetchPastOrders(search, filterDate, showCompleted, showCancelled),
  };
}
