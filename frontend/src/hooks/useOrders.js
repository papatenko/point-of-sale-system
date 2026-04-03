import { useState, useEffect, useCallback } from "react";

export function useOrders({ token = null, selectedTruck = null } = {}) {
  const [currentOrders, setCurrentOrders] = useState([]);
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Past orders filters
  const [filterDate, setFilterDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCancelled, setShowCancelled] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const fetchPastOrders = useCallback(async (q = "", date = "", completed = true, cancelled = true, pg = 1) => {
    try {
      const statuses = [
        ...(completed ? ["completed"] : []),
        ...(cancelled ? ["cancelled"] : []),
      ];
      if (statuses.length === 0) {
        setPastOrders([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ status: statuses.join(","), page: pg });
      if (q) params.set("search", q);
      if (date) params.set("date", date);
      if (selectedTruck) params.set("truck", selectedTruck);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers });
      const data = await res.json();
      setPastOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalPages(data.pages ?? 1);
    } catch {
      setPastOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedTruck]);

  useEffect(() => {
    fetchCurrentOrders();
    fetchScheduledOrders();
    fetchPastOrders(search, filterDate, showCompleted, showCancelled, page);
  }, [fetchCurrentOrders, fetchScheduledOrders, fetchPastOrders]);

  // Auto-refresh current + scheduled orders every 10s
  useEffect(() => {
    const id = setInterval(() => {
      fetchCurrentOrders();
      fetchScheduledOrders();
    }, 10_000);
    return () => clearInterval(id);
  }, [fetchCurrentOrders, fetchScheduledOrders]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, filterDate, showCompleted, showCancelled]);

  // Re-fetch past orders when search/filters/page change
  useEffect(() => {
    const timer = setTimeout(
      () => fetchPastOrders(search, filterDate, showCompleted, showCancelled, page),
      300
    );
    return () => clearTimeout(timer);
  }, [search, filterDate, showCompleted, showCancelled, page, fetchPastOrders]);

  return {
    currentOrders,
    scheduledOrders,
    pastOrders,
    search, setSearch,
    filterDate, setFilterDate,
    showCompleted, setShowCompleted,
    showCancelled, setShowCancelled,
    page, setPage,
    totalPages,
    loading,
    refreshCurrent: () => { fetchCurrentOrders(); fetchScheduledOrders(); },
    refreshPast: () => fetchPastOrders(search, filterDate, showCompleted, showCancelled, page),
  };
}
