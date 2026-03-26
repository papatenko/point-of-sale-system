import { useState, useEffect, useCallback, useMemo } from "react";

const buildChartRows = (rows, nameKey = "categoryName", extras = []) => {
  if (!Array.isArray(rows)) return [];
  const base = rows.map((r) => ({
    name: r[nameKey],
    value: Number(r.total) ?? 0,
  }));
  for (const ex of extras) {
    if (ex && ex.value > 0) base.push({ name: ex.name, value: ex.value });
  }
  return base
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
};

export function useReports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [pendingStart, setPendingStart] = useState("");
  const [pendingEnd, setPendingEnd] = useState("");

  const fetchStats = useCallback(async (filter) => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filter) {
          params.set("start", filter.start);
          params.set("end", filter.end);
        }
        const qs = params.toString();
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/reports/stats${qs ? `?${qs}` : ""}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to load stats");
        }
        if (cancelled) return;
        setStats(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchStats(appliedFilter);
    return () => {
      if (cleanup && cleanup.then) {
        cleanup.then((fn) => fn && fn());
      }
    };
  }, [appliedFilter, fetchStats]);

  const handleApplyFilter = useCallback(() => {
    if (!pendingStart || !pendingEnd) {
      setError("Select both start and end dates.");
      return;
    }
    if (pendingStart > pendingEnd) {
      setError("Start date must be on or before end date.");
      return;
    }
    setError(null);
    setAppliedFilter({ start: pendingStart, end: pendingEnd });
  }, [pendingStart, pendingEnd]);

  const handleClearFilter = useCallback(() => {
    setPendingStart("");
    setPendingEnd("");
    setAppliedFilter(null);
    setError(null);
  }, []);

  const ethnicityChartData = useMemo(() => {
    if (!stats?.ethnicityByRace) return [];
    const rows = stats.ethnicityByRace.map((r) => ({
      name: r.race,
      value: r.total,
    }));
    if ((stats.ethnicityUnspecified ?? 0) > 0) {
      rows.push({ name: "Not specified", value: stats.ethnicityUnspecified });
    }
    return rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [stats]);

  const usersWithEthnicity = useMemo(() => {
    if (!stats?.ethnicityByRace) return 0;
    return stats.ethnicityByRace.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [stats]);

  const menuChartData = useMemo(
    () =>
      buildChartRows(stats?.menuItemsByCategory, "categoryName", [
        {
          name: "Uncategorized",
          value: stats?.menuItemsUncategorized ?? 0,
        },
      ]),
    [stats],
  );

  const ingredientsChartData = useMemo(
    () => buildChartRows(stats?.ingredientsByCategory),
    [stats],
  );

  const ordersChartData = useMemo(
    () => buildChartRows(stats?.ordersByCategory),
    [stats],
  );

  const soldChartData = useMemo(
    () =>
      buildChartRows(stats?.itemsSoldByCategory, "categoryName", [
        {
          name: "Uncategorized",
          value: stats?.itemsSoldUncategorized ?? 0,
        },
      ]),
    [stats],
  );

  const trucksChartData = useMemo(() => {
    if (!stats?.ordersByTruck?.length) return [];
    return [...stats.ordersByTruck]
      .map((r) => ({
        name: r.truck_name,
        value: Number(r.total_orders) || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const money = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

  return {
    stats,
    error,
    loading,
    appliedFilter,
    pendingStart,
    pendingEnd,
    setPendingStart,
    setPendingEnd,
    handleApplyFilter,
    handleClearFilter,
    ethnicityChartData,
    usersWithEthnicity,
    menuChartData,
    ingredientsChartData,
    ordersChartData,
    soldChartData,
    trucksChartData,
    money,
    refresh: () => fetchStats(appliedFilter),
  };
}
