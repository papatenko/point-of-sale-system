import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/employee/reports")({
  component: RouteComponent,
});

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#4d7c0f",
  "#c2410c",
  "#7c3aed",
];

/** Build { name, value }[] for horizontal bar charts; optional extra rows (e.g. uncategorized). */
function buildChartRows(
  rows,
  nameKey = "categoryName",
  extras = [],
) {
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
}

function ReportBarChartCard({
  title,
  total,
  summary,
  chartData,
  valueLabel,
  emptyMessage = "No data to display yet.",
  chartHeightClass = "h-[min(320px,55vh)] min-h-[200px]",
  cardClassName = "",
  yAxisWidth = 140,
}) {
  return (
    <Card className={`mt-4 ${cardClassName}`.trim()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {summary}
          {total != null && (
            <span className="mt-1 block font-medium text-foreground">
              Total: {total}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className={`w-full ${chartHeightClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} className="text-xs" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value) => [`${value}`, valueLabel]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="value" name={valueLabel} radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [pendingStart, setPendingStart] = useState("");
  const [pendingEnd, setPendingEnd] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (appliedFilter) {
          params.set("start", appliedFilter.start);
          params.set("end", appliedFilter.end);
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
  }, [appliedFilter]);

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

  const money = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

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

  /** All trucks (including 0 orders), label by name + plate when helpful */
  const trucksChartData = useMemo(() => {
    if (!stats?.ordersByTruck?.length) return [];
    return [...stats.ordersByTruck]
      .map((r) => {
        const name = (r.truckName || "").trim();
        const plate = r.licensePlate || "";
        const label =
          name && plate
            ? `${name} (${plate})`
            : name || plate || "Truck";
        return { name: label, value: Number(r.total) || 0 };
      })
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const orderFilterActive = Boolean(stats?.filters?.orderMetricsFiltered);

  return (
    <div className="p-5 max-w-5xl">
      <h1 className="text-lg font-semibold">Reports Dashboard</h1>

      <Card className="mt-4 border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/25">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Order date range</CardTitle>
          <CardDescription>
            Limit <strong>orders</strong>, <strong>revenue</strong>,{" "}
            <strong>items sold</strong>, <strong>order type</strong>, and{" "}
            <strong>truck order counts</strong> to orders placed in this range
            (uses each order&apos;s scheduled / placed time). Catalog-style
            totals (users, menu items, ingredients, suppliers) stay all-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="report-start">Start</Label>
            <Input
              id="report-start"
              type="date"
              value={pendingStart}
              onChange={(e) => setPendingStart(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-end">End</Label>
            <Input
              id="report-end"
              type="date"
              value={pendingEnd}
              onChange={(e) => setPendingEnd(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleApplyFilter}>
            Apply
          </Button>
          <Button type="button" variant="outline" onClick={handleClearFilter}>
            Clear
          </Button>
        </CardContent>
        {orderFilterActive && stats?.filters?.startDate && stats?.filters?.endDate && (
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Active:{" "}
            <span className="font-medium text-foreground">
              {stats.filters.startDate} – {stats.filters.endDate}
            </span>
          </CardContent>
        )}
      </Card>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
      {loading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}

      <div className="mt-5 space-y-2 text-sm">
        <div>Total Employees: {stats?.totalEmployees ?? "—"}</div>
        <div>Total Users: {stats?.totalUsers ?? "—"}</div>

        {stats?.ethnicityByRace && stats.ethnicityByRace.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Users by ethnicity</CardTitle>
              <CardDescription>
                {stats.totalUsers != null && (
                  <span className="block">
                    Summary:{" "}
                    <strong>{stats.totalUsers}</strong> user
                    {stats.totalUsers === 1 ? "" : "s"} in the system.{" "}
                    <strong>{usersWithEthnicity}</strong> with a recorded
                    ethnicity
                    {stats.ethnicityUnspecified > 0 && (
                      <>
                        ; <strong>{stats.ethnicityUnspecified}</strong> with
                        ethnicity not specified
                      </>
                    )}
                    .
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ethnicityChartData.length > 0 ? (
                <div className="w-full h-[min(420px,70vh)] min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ethnicityChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        className="text-xs"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={148}
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`${value}`, "Users"]}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="value" name="Users" radius={[0, 4, 4, 0]}>
                        {ethnicityChartData.map((_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No users with a recorded ethnicity yet—breakdown will appear
                  once user profiles include ethnicity.
                </p>
              )}

              <ul className="list-disc pl-5 space-y-1 text-sm border-t pt-3">
                {stats.ethnicityByRace.map((row) => (
                  <li key={row.raceId}>
                    Total {row.race}: {row.total}
                  </li>
                ))}
                {(stats.ethnicityUnspecified ?? 0) > 0 && (
                  <li>Total Not specified: {stats.ethnicityUnspecified}</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <ReportBarChartCard
            title="Total items on menu (by category)"
            total={stats?.totalMenuItems}
            summary="Menu items grouped by menu category (e.g. Appetizers, Entrees, Sides, Desserts, Drinks)."
            chartData={menuChartData}
            valueLabel="Menu items"
            emptyMessage="No menu items yet, or categories have no items."
          />

          <ReportBarChartCard
            title="Total ingredients (by category)"
            total={stats?.totalIngredients}
            summary="Ingredients grouped by their stored category field (e.g. produce, dairy—or Uncategorized if blank)."
            chartData={ingredientsChartData}
            valueLabel="Ingredients"
            emptyMessage="No ingredients in the database yet."
          />

          <ReportBarChartCard
            title="Total orders (by order type)"
            total={stats?.totalOrders}
            summary={`Orders grouped by how they were placed: walk-in vs online pickup.${orderFilterActive ? " Counts only orders in the selected date range." : ""}`}
            chartData={ordersChartData}
            valueLabel="Orders"
            emptyMessage="No orders placed yet."
          />

          <ReportBarChartCard
            title="Total items sold (by menu category)"
            total={stats?.totalItemsSold}
            summary={`Sum of line-item quantities sold, grouped by the menu item’s category (drinks, desserts, etc.).${orderFilterActive ? " Quantities only from orders in the selected date range." : ""}`}
            chartData={soldChartData}
            valueLabel="Units sold"
            emptyMessage="No order line items yet."
          />

          <ReportBarChartCard
            title="Total trucks (orders per truck)"
            total={stats?.totalTrucks}
            summary={`Each bar is a registered food truck; length is how many checkout orders used that truck’s license plate.${orderFilterActive ? " Order counts only include the selected date range." : ""}`}
            chartData={trucksChartData}
            valueLabel="Orders"
            emptyMessage="No food trucks registered yet."
            cardClassName="lg:col-span-2"
            yAxisWidth={200}
            chartHeightClass="h-[min(420px,65vh)] min-h-[220px]"
          />
        </div>

        <div className="mt-4 space-y-2 border-t pt-4">
          <div>Total Suppliers: {stats?.totalSuppliers ?? "—"}</div>
          <div>
            Gross Income: ${stats != null ? money(stats.grossIncome) : "—"}
            {orderFilterActive && (
              <span className="text-muted-foreground">
                {" "}
                (from orders in selected range, excluding cancelled / refunded
                payments)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
