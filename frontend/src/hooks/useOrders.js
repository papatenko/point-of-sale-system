import { useState, useEffect, useCallback } from "react";

export function useOrders() {
  const [currentOrders, setCurrentOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCurrentOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=pending,preparing,ready");
      const data = await res.json();
      setCurrentOrders(Array.isArray(data) ? data : []);
    } catch {
      setCurrentOrders([]);
    }
  }, []);

  const fetchPastOrders = useCallback(async (q = "") => {
    try {
      const params = new URLSearchParams({ status: "completed,cancelled" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setPastOrders(Array.isArray(data) ? data : []);
    } catch {
      setPastOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
