import { useState, useEffect, useCallback } from "react";

export function useOrders({ token = null, selectedTruck = null } = {}) {
  const [currentOrders, setCurrentOrders] = useState([]);
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Past orders filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCancelled, setShowCancelled] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  

  const fetchCurrentOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "pending,preparing,ready" });
      if (selectedTruck) params.set("truck", selectedTruck);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers });
      const data = await res.json();
      const all = Array.isArray(data) ? data : [];
      // Immediate orders: preparing/ready (any), OR pending with no scheduled_time
      setCurrentOrders(all.filter((o) => o.order_status !== "pending" || !o.scheduled_time));
      // Scheduled orders: pending AND has a future scheduled_time
      setScheduledOrders(all.filter((o) => o.order_status === "pending" && !!o.scheduled_time));
    } catch {
      setCurrentOrders([]);
      setScheduledOrders([]);
    }
  }, [token, selectedTruck]);

  const fetchPastOrders = useCallback(async (q = "", dateFrom = "", dateTo = "", completed = true, cancelled = true, pg = 1) => {
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
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
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
    fetchPastOrders(search, filterDateFrom, filterDateTo, showCompleted, showCancelled, page);
  }, [fetchCurrentOrders, fetchPastOrders]);

  // Auto-refresh current + scheduled orders every 10s
  useEffect(() => {
    const id = setInterval(() => {
      fetchCurrentOrders();
    }, 10_000);
    return () => clearInterval(id);
  }, [fetchCurrentOrders]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, filterDateFrom, filterDateTo, showCompleted, showCancelled]);

  // Re-fetch past orders when search/filters/page change
  useEffect(() => {
    const timer = setTimeout(
      () => fetchPastOrders(search, filterDateFrom, filterDateTo, showCompleted, showCancelled, page),
      300
    );
    return () => clearTimeout(timer);
  }, [search, filterDateFrom, filterDateTo, showCompleted, showCancelled, page, fetchPastOrders]);

  return {
    currentOrders,
    scheduledOrders,
    pastOrders,
    search, setSearch,
    filterDateFrom, setFilterDateFrom,
    filterDateTo, setFilterDateTo,
    showCompleted, setShowCompleted,
    showCancelled, setShowCancelled,
    page, setPage,
    totalPages,
    loading,
    refreshCurrent: () => { fetchCurrentOrders(); },
    refreshPast: () => fetchPastOrders(search, filterDateFrom, filterDateTo, showCompleted, showCancelled, page),
  };
}
