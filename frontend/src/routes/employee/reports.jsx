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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    ...r,
    name: r[nameKey],
    value: Number(r.total) ?? 0,
    details: Array.isArray(r.details) ? r.details : [],
  }));
  for (const ex of extras) {
    if (ex && ex.value > 0) {
      base.push({ name: ex.name, value: ex.value, details: ex.details || [] });
    }
  }
  return base
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}

function renderTooltipDetails(items = []) {
  const trimmed = items.filter(Boolean);
  if (trimmed.length === 0) return null;
  const preview = trimmed.slice(0, 8);
  const remaining = trimmed.length - preview.length;
  return (
    <div className="mt-1 border-t pt-1 text-xs text-muted-foreground">
      <div className="font-medium">Includes:</div>
      <ul className="list-disc pl-4">
        {preview.map((item, i) => (
          <li key={`${item}-${i}`}>{item}</li>
        ))}
      </ul>
      {remaining > 0 && <div>+{remaining} more</div>}
    </div>
  );
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
                  width={yAxisWidth}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload;
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow">
                        <div className="font-medium">{row?.name}</div>
                        <div>
                          {valueLabel}: <span className="font-semibold">{row?.value ?? 0}</span>
                        </div>
                        {renderTooltipDetails(row?.details)}
                      </div>
                    );
                  }}
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
  const [reportPickerValue, setReportPickerValue] = useState("");
  const [activeReport, setActiveReport] = useState(null);

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
  const activeReportIsOrderBased =
    activeReport === "ordersByType" ||
    activeReport === "itemsSoldByCategory" ||
    activeReport === "ordersByTruck";

  const reportOptions = useMemo(
    () => [
      { key: "usersByEthnicity", label: "Users by ethnicity" },
      { key: "menuItemsByCategory", label: "Menu items by category" },
      { key: "ingredientsByCategory", label: "Ingredients by category" },
      { key: "ordersByType", label: "Orders by type" },
      { key: "itemsSoldByCategory", label: "Items sold by menu category" },
      { key: "ordersByTruck", label: "Orders per truck" },
    ],
    [],
  );

  return (
    <div className="p-5 max-w-5xl">
      <h1 className="text-lg font-semibold">Reports Dashboard</h1>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
      {loading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}

      <div className="mt-5 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Totals</CardTitle>
            <CardDescription>
              Don&apos;t display charts until you pick one below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "usersByEthnicity", label: "Total Users", value: stats?.totalUsers ?? "—" },
              { key: "usersByEthnicity", label: "Total Employees", value: stats?.totalEmployees ?? "—" },
              { key: "menuItemsByCategory", label: "Total Items on Menu", value: stats?.totalMenuItems ?? "—" },
              { key: "ingredientsByCategory", label: "Total Ingredients", value: stats?.totalIngredients ?? "—" },
              { key: "ordersByType", label: "Total Orders", value: stats?.totalOrders ?? "—" },
              { key: "itemsSoldByCategory", label: "Total Items Sold", value: stats?.totalItemsSold ?? "—" },
              { key: "ordersByTruck", label: "Total Trucks", value: stats?.totalTrucks ?? "—" },
              { key: "menuItemsByCategory", label: "Total Suppliers", value: stats?.totalSuppliers ?? "—" },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setActiveReport(t.key)}
                className="text-left rounded-lg border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="text-xs text-muted-foreground">{t.label}</div>
                <div className="mt-1 text-lg font-semibold">{t.value}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Report picker</CardTitle>
            <CardDescription>
              Use the dropdown, then click <strong>View chart</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5 min-w-[240px]">
              <Label>Chart</Label>
              <Select value={reportPickerValue} onValueChange={setReportPickerValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a chart…" />
                </SelectTrigger>
                <SelectContent>
                  {reportOptions.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={() => setActiveReport(reportPickerValue || null)}
              disabled={!reportPickerValue}
            >
              View chart
            </Button>
            <Button type="button" variant="outline" onClick={() => setActiveReport(null)}>
              Hide chart
            </Button>
          </CardContent>
        </Card>

        {activeReportIsOrderBased && (
          <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Order date range</CardTitle>
              <CardDescription>
                Filters order-based charts (orders, revenue, items sold, order
                type, truck order counts). Catalog totals stay all-time.
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
            {orderFilterActive &&
              stats?.filters?.startDate &&
              stats?.filters?.endDate && (
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  Active:{" "}
                  <span className="font-medium text-foreground">
                    {stats.filters.startDate} – {stats.filters.endDate}
                  </span>
                </CardContent>
              )}
          </Card>
        )}
        {activeReport === "usersByEthnicity" && (
          <Card className="mt-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Users by ethnicity</CardTitle>
              <CardDescription>
                Summary: <strong>{stats?.totalUsers ?? 0}</strong> users.{" "}
                <strong>{usersWithEthnicity}</strong> with a recorded ethnicity
                {stats?.ethnicityUnspecified > 0 && (
                  <>
                    ; <strong>{stats.ethnicityUnspecified}</strong> not specified
                  </>
                )}
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full h-[min(420px,70vh)] min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ethnicityChartData}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} className="text-xs" />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} interval={0} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
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
            </CardContent>
          </Card>
        )}

        {activeReport === "menuItemsByCategory" && (
          <ReportBarChartCard
            title="Total items on menu (by category)"
            total={stats?.totalMenuItems}
            summary="Menu items grouped by menu category (e.g. Appetizers, Entrees, Sides, Desserts, Drinks)."
            chartData={menuChartData}
            valueLabel="Menu items"
            emptyMessage="No menu items yet, or categories have no items."
          />
        )}

        {activeReport === "ingredientsByCategory" && (
          <ReportBarChartCard
            title="Total ingredients (by category)"
            total={stats?.totalIngredients}
            summary="Ingredients grouped by their stored category field (e.g. produce, dairy—or Uncategorized if blank)."
            chartData={ingredientsChartData}
            valueLabel="Ingredients"
            emptyMessage="No ingredients in the database yet."
          />
        )}

        {activeReport === "ordersByType" && (
          <ReportBarChartCard
            title="Total orders (by order type)"
            total={stats?.totalOrders}
            summary={`Orders grouped by how they were placed: walk-in vs online pickup.${orderFilterActive ? " Counts only orders in the selected date range." : ""}`}
            chartData={ordersChartData}
            valueLabel="Orders"
            emptyMessage="No orders placed yet."
          />
        )}

        {activeReport === "itemsSoldByCategory" && (
          <ReportBarChartCard
            title="Total items sold (by menu category)"
            total={stats?.totalItemsSold}
            summary={`Sum of line-item quantities sold, grouped by the menu item’s category (drinks, desserts, etc.).${orderFilterActive ? " Quantities only from orders in the selected date range." : ""}`}
            chartData={soldChartData}
            valueLabel="Units sold"
            emptyMessage="No order line items yet."
          />
        )}

        {activeReport === "ordersByTruck" && (
          <ReportBarChartCard
            title="Total trucks (orders per truck)"
            total={stats?.totalTrucks}
            summary={`Each bar is a registered food truck; length is how many checkout orders used that truck’s license plate.${orderFilterActive ? " Order counts only include the selected date range." : ""}`}
            chartData={trucksChartData}
            valueLabel="Orders"
            emptyMessage="No food trucks registered yet."
            yAxisWidth={220}
            chartHeightClass="h-[min(420px,65vh)] min-h-[220px]"
          />
        )}

        {activeReportIsOrderBased && (
          <div className="text-sm">
            Gross Income: ${stats != null ? money(stats.grossIncome) : "—"}
            {orderFilterActive && (
              <span className="text-muted-foreground">
                {" "}
                (from orders in selected range, excluding cancelled / refunded payments)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
