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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
const ORDER_DATE_RANGE_ERROR = "Start date must be on or before end date.";

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
          <li key={`${typeof item === "string" ? item : item?.name || "item"}-${i}`}>
            {typeof item === "string"
              ? item
              : `${item?.name || "Item"}: ${item?.quantity ?? 0}`}
          </li>
        ))}
      </ul>
      {remaining > 0 && <div>+{remaining} more</div>}
    </div>
  );
}

function formatDateTime(value) {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function moneyCell(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function includesSearch(value, searchTerm) {
  if (!searchTerm) return true;
  if (value == null) return false;
  return String(value).toLowerCase().includes(searchTerm);
}

function ReportDetailTableWrap({ title, rowLimit, children }) {
  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="max-h-[min(420px,50vh)] overflow-auto rounded-md border">
        {children}
      </div>
      {rowLimit != null && (
        <p className="text-xs text-muted-foreground">
          Showing up to {rowLimit} rows (newest orders first where applicable).
        </p>
      )}
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
  detail = null,
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
        {detail}
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
  const [truckFilterPlate, setTruckFilterPlate] = useState("");
  const [ethnicityFilter, setEthnicityFilter] = useState("__all__");
  const [orderTypeFilter, setOrderTypeFilter] = useState("__all__");
  const [tableSearch, setTableSearch] = useState("");
  const [trucks, setTrucks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    fetch("/api/trucks", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTrucks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTrucks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTableSearch("");
  }, [activeReport]);

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
        if (truckFilterPlate) {
          params.set("truck", truckFilterPlate);
        }
        if (ethnicityFilter !== "__all__") {
          params.set(
            "ethnicity",
            ethnicityFilter === "__unspecified__" ? "unspecified" : ethnicityFilter,
          );
        }
        if (orderTypeFilter !== "__all__") {
          params.set("orderType", orderTypeFilter);
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
  }, [appliedFilter, truckFilterPlate, ethnicityFilter, orderTypeFilter]);

  const handleApplyFilter = useCallback(() => {
    if (!pendingStart || !pendingEnd) {
      setError("Select both start and end dates.");
      return;
    }
    if (pendingStart > pendingEnd) {
      setError("Start date must be on or before end date bum");
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

  const menuChartData = useMemo(() => {
    const rows = buildChartRows(stats?.menuItemsByCategory, "categoryName", [
      {
        name: "Uncategorized",
        value: stats?.menuItemsUncategorized ?? 0,
      },
    ]);
    return rows;
  }, [stats]);

  const ingredientsChartData = useMemo(() => {
    const rows = buildChartRows(stats?.ingredientsByCategory);
    return rows;
  }, [stats]);

  const ordersChartData = useMemo(() => {
    const rows = buildChartRows(stats?.ordersByCategory);
    return rows;
  }, [stats]);

  const soldChartData = useMemo(() => {
    const rows = buildChartRows(stats?.itemsSoldByCategory, "categoryName", [
      {
        name: "Uncategorized",
        value: stats?.itemsSoldUncategorized ?? 0,
        details: stats?.itemsSoldUncategorizedDetails ?? [],
      },
    ]);
    return rows;
  }, [stats]);

  /** All trucks (including 0 orders), label by name + plate when helpful */
  const trucksChartData = useMemo(() => {
    if (!stats?.ordersByTruck?.length) return [];
    const rows = [...stats.ordersByTruck]
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
    return rows;
  }, [stats]);

  const orderFinalStatusChartData = useMemo(() => {
    const rows = stats?.reportDetails?.orders ?? [];
    if (!rows.length) return [];
    const totals = new Map();
    for (const row of rows) {
      const status = String(row.orderStatus || "Unknown").trim() || "Unknown";
      totals.set(status, (totals.get(status) || 0) + 1);
    }
    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const ethnicityFilterOptions = useMemo(() => {
    const base = (stats?.ethnicityByRace || [])
      .filter((r) => r.raceId != null)
      .map((r) => ({ label: r.race, value: String(r.raceId) }));
    if ((stats?.ethnicityUnspecified ?? 0) > 0) {
      base.push({ label: "Not specified", value: "__unspecified__" });
    }
    return base;
  }, [stats]);

  const orderTypeFilterOptions = useMemo(
    () =>
      (stats?.ordersByCategory || [])
        .map((r) => ({ label: r.categoryName, value: r.rawCategoryName || r.categoryName }))
        .filter((r) => r.value),
    [stats],
  );

  const orderFilterActive = Boolean(stats?.filters?.orderMetricsFiltered);
  const truckFilterActive = Boolean(stats?.filters?.truck);
  const ethnicityUsesOrderDates = Boolean(stats?.filters?.ethnicityUsesOrderDates);
  const activeReportIsOrderBased =
    activeReport === "totalMoneyMade" ||
    activeReport === "orderFinalStatus" ||
    activeReport === "itemsSoldByCategory" ||
    activeReport === "ordersByTruck";
  const showOrderDateRangeCard =
    activeReportIsOrderBased ||
    (activeReport === "usersByEthnicity" && Boolean(truckFilterPlate));

  const reportOptions = useMemo(
    () => [
      { key: "itemsSoldByCategory", label: "Items sold by menu category" },
      { key: "totalMoneyMade", label: "Revenue" },
      { key: "orderFinalStatus", label: "Final status of orders" },
    ],
    [],
  );

  const detailLimit = stats?.reportDetails?.rowLimit ?? 500;
  const normalizedTableSearch = tableSearch.trim().toLowerCase();

  const ethnicityUsersTable = useMemo(() => {
    const rows = (stats?.reportDetails?.ethnicityUsers ?? []).filter((r) =>
      [
        r.ethnicity,
        r.firstName,
        r.lastName,
        r.email,
        r.phoneNumber,
      ].some((value) => includesSearch(value, normalizedTableSearch)),
    );
    if (rows.length === 0) {
      return (
        <ReportDetailTableWrap title="Underlying records" rowLimit={detailLimit}>
          <p className="p-4 text-sm text-muted-foreground">No user rows for the current filters.</p>
        </ReportDetailTableWrap>
      );
    }
    return (
      <ReportDetailTableWrap title="Users (names & contact)" rowLimit={detailLimit}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ethnicity</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.email}>
                <TableCell className="whitespace-normal">{r.ethnicity}</TableCell>
                <TableCell className="whitespace-normal">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell className="whitespace-normal">{r.email}</TableCell>
                <TableCell>{r.phoneNumber || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>One row per customer in scope of this report.</TableCaption>
        </Table>
      </ReportDetailTableWrap>
    );
  }, [stats, detailLimit, normalizedTableSearch]);

  const menuItemsDetailTable = useMemo(() => {
    const rows = (stats?.reportDetails?.menuItems ?? []).filter((r) =>
      [r.categoryName, r.itemName, r.price, r.isAvailable ? "yes" : "no"].some((value) =>
        includesSearch(value, normalizedTableSearch),
      ),
    );
    if (rows.length === 0) {
      return (
        <ReportDetailTableWrap title="Menu items (detail)" rowLimit={detailLimit}>
          <p className="p-4 text-sm text-muted-foreground">No menu items for the current filters.</p>
        </ReportDetailTableWrap>
      );
    }
    return (
      <ReportDetailTableWrap title="Menu items (detail)" rowLimit={detailLimit}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.menuItemId}>
                <TableCell className="whitespace-normal">{r.categoryName}</TableCell>
                <TableCell className="whitespace-normal">{r.itemName}</TableCell>
                <TableCell>${moneyCell(r.price)}</TableCell>
                <TableCell>{r.isAvailable ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportDetailTableWrap>
    );
  }, [stats, detailLimit, normalizedTableSearch]);

  const ingredientsDetailTable = useMemo(() => {
    const rows = (stats?.reportDetails?.ingredients ?? []).filter((r) =>
      [r.categoryName, r.ingredientName].some((value) =>
        includesSearch(value, normalizedTableSearch),
      ),
    );
    if (rows.length === 0) {
      return (
        <ReportDetailTableWrap title="Ingredients (detail)" rowLimit={detailLimit}>
          <p className="p-4 text-sm text-muted-foreground">No ingredients for the current filters.</p>
        </ReportDetailTableWrap>
      );
    }
    return (
      <ReportDetailTableWrap title="Ingredients (detail)" rowLimit={detailLimit}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Ingredient</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.ingredientId}>
                <TableCell className="whitespace-normal">{r.categoryName}</TableCell>
                <TableCell className="whitespace-normal">{r.ingredientName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportDetailTableWrap>
    );
  }, [stats, detailLimit, normalizedTableSearch]);

  const ordersDetailTable = useMemo(() => {
    const rows = (stats?.reportDetails?.orders ?? []).filter((r) =>
      [
        r.orderPlacedAt,
        r.orderNumber,
        r.orderTypeLabel,
        r.orderType,
        r.truckName,
        r.licensePlate,
        r.customerName,
        r.customerEmail,
        r.orderStatus,
        r.paymentStatus,
        r.paymentMethod,
        r.totalPrice,
      ].some((value) => includesSearch(value, normalizedTableSearch)),
    );
    if (rows.length === 0) {
      return (
        <ReportDetailTableWrap title="Orders (detail)" rowLimit={detailLimit}>
          <p className="p-4 text-sm text-muted-foreground">No orders for the current filters.</p>
        </ReportDetailTableWrap>
      );
    }
    return (
      <ReportDetailTableWrap title="Orders (detail)" rowLimit={detailLimit}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placed</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.checkoutId}>
                <TableCell className="whitespace-nowrap">{formatDateTime(r.orderPlacedAt)}</TableCell>
                <TableCell>{r.orderNumber}</TableCell>
                <TableCell>{r.orderTypeLabel || r.orderType}</TableCell>
                <TableCell className="whitespace-normal">
                  {(r.truckName || "").trim() || r.licensePlate}
                  {r.licensePlate ? (
                    <span className="text-muted-foreground"> ({r.licensePlate})</span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-normal max-w-[200px]">
                  {r.customerName || r.customerEmail || "—"}
                </TableCell>
                <TableCell>{r.orderStatus}</TableCell>
                <TableCell>
                  {r.paymentStatus} / {r.paymentMethod}
                </TableCell>
                <TableCell>${moneyCell(r.totalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportDetailTableWrap>
    );
  }, [stats, detailLimit, normalizedTableSearch]);

  const orderLineItemsDetailTable = useMemo(() => {
    const rows = (stats?.reportDetails?.orderLineItems ?? []).filter((r) =>
      [
        r.orderPlacedAt,
        r.orderNumber,
        r.orderTypeLabel,
        r.orderType,
        r.truckName,
        r.licensePlate,
        r.menuCategoryName,
        r.itemName,
        r.quantity,
        r.lineTotalPrice,
      ].some((value) => includesSearch(value, normalizedTableSearch)),
    );
    if (rows.length === 0) {
      return (
        <ReportDetailTableWrap title="Line items sold (detail)" rowLimit={detailLimit}>
          <p className="p-4 text-sm text-muted-foreground">No line items for the current filters.</p>
        </ReportDetailTableWrap>
      );
    }
    return (
      <ReportDetailTableWrap title="Line items sold (detail)" rowLimit={detailLimit}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placed</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Menu category</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.checkoutId}-${r.orderNumber}-${r.itemName}-${i}`}>
                <TableCell className="whitespace-nowrap">{formatDateTime(r.orderPlacedAt)}</TableCell>
                <TableCell>{r.orderNumber}</TableCell>
                <TableCell>{r.orderTypeLabel || r.orderType}</TableCell>
                <TableCell className="whitespace-normal">
                  {(r.truckName || "").trim() || r.licensePlate}
                </TableCell>
                <TableCell className="whitespace-normal">{r.menuCategoryName}</TableCell>
                <TableCell className="whitespace-normal">{r.itemName}</TableCell>
                <TableCell>{r.quantity}</TableCell>
                <TableCell>${moneyCell(r.lineTotalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportDetailTableWrap>
    );
  }, [stats, detailLimit, normalizedTableSearch]);

  const grossIncomeByMonthChartData = useMemo(() => {
    const rows = stats?.reportDetails?.grossIncomeByMonth ?? [];
    return rows
      .map((r) => ({
        name: r.monthLabel || r.monthKey,
        value: Number(r.grossIncome) || 0,
        orderCount: Number(r.orderCount) || 0,
      }))
      .filter((r) => r.value > 0);
  }, [stats]);

  const grossIncomeOrdersDetailTable = useMemo(() => {
    const rows = (stats?.reportDetails?.grossIncomeOrders ?? []).filter((r) =>
      [
        r.orderPlacedAt,
        r.orderNumber,
        r.orderTypeLabel,
        r.orderType,
        r.truckName,
        r.licensePlate,
        r.customerName,
        r.customerEmail,
        r.orderStatus,
        r.paymentStatus,
        r.paymentMethod,
        r.totalPrice,
      ].some((value) => includesSearch(value, normalizedTableSearch)),
    );
    if (rows.length === 0) {
      return (
        <ReportDetailTableWrap title="Orders included in report">
          <p className="p-4 text-sm text-muted-foreground">
            No orders for the current filters.
          </p>
        </ReportDetailTableWrap>
      );
    }
    return (
      <ReportDetailTableWrap title="Orders included in report">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placed</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.checkoutId}>
                <TableCell className="whitespace-nowrap">{formatDateTime(r.orderPlacedAt)}</TableCell>
                <TableCell>{r.orderNumber}</TableCell>
                <TableCell>{r.orderTypeLabel || r.orderType}</TableCell>
                <TableCell className="whitespace-normal">
                  {(r.truckName || "").trim() || r.licensePlate}
                  {r.licensePlate ? (
                    <span className="text-muted-foreground"> ({r.licensePlate})</span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-normal max-w-[200px]">
                  {r.customerName || r.customerEmail || "—"}
                </TableCell>
                <TableCell>{r.orderStatus}</TableCell>
                <TableCell>
                  {r.paymentStatus} / {r.paymentMethod}
                </TableCell>
                <TableCell>${moneyCell(r.totalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportDetailTableWrap>
    );
  }, [stats, normalizedTableSearch]);

  return (
    <div className="p-5 max-w-5xl">
      <h1 className="text-lg font-semibold">Reports Dashboard</h1>

      {error && error !== ORDER_DATE_RANGE_ERROR && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
      {loading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}

      <div className="mt-5 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Totals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? "—" },
              { label: "Total Employees", value: stats?.totalEmployees ?? "—" },
              { label: "Total Items on Menu", value: stats?.totalMenuItems ?? "—" },
              { label: "Total Ingredients", value: stats?.totalIngredients ?? "—" },
              {
                label: "Total Orders",
                value: stats?.totalOrders ?? "—",
                reportKey: "orderFinalStatus",
              },
              {
                label: "Total Items Sold",
                value: stats?.totalItemsSold ?? "—",
                reportKey: "itemsSoldByCategory",
              },
              { label: "Total Trucks", value: stats?.totalTrucks ?? "—" },
              { label: "Total Suppliers", value: stats?.totalSuppliers ?? "—" },
              {
                label: "Total Money Made",
                value: stats ? `$${money(stats.grossIncome)}` : "—",
                reportKey: "totalMoneyMade",
              },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  if (t.reportKey) setActiveReport(t.reportKey);
                }}
                className={`text-left rounded-lg border bg-card px-4 py-3 transition-colors ${
                  t.reportKey ? "hover:bg-muted/40 cursor-pointer" : "cursor-default"
                }`}
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

        <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Filters</CardTitle>    
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-[260px] gap-1.5">
              <Label>Truck</Label>
              <Select
                value={truckFilterPlate || "__all__"}
                onValueChange={(v) => setTruckFilterPlate(v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All trucks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All trucks</SelectItem>
                  {trucks.map((t) => (
                    <SelectItem key={t.license_plate} value={t.license_plate}>
                      {(t.truck_name || "").trim() || t.license_plate}{" "}
                      <span className="text-muted-foreground">({t.license_plate})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-[220px] gap-1.5">
              <Label>Ethnicity</Label>
              <Select value={ethnicityFilter} onValueChange={setEthnicityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All ethnicities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All ethnicities</SelectItem>
                  {ethnicityFilterOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-[220px] gap-1.5">
              <Label>Order type</Label>
              <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All order types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All order types</SelectItem>
                  {orderTypeFilterOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {showOrderDateRangeCard && (
          <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Order date range</CardTitle>
              {error === ORDER_DATE_RANGE_ERROR && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
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
                {truckFilterActive ? (
                  <>
                    Filtered to customers who placed at least one order at truck{" "}
                    <strong>{stats.filters.truck}</strong>
                    {ethnicityUsesOrderDates ? (
                      <>
                        , using only checkouts in the active{" "}
                        <strong>order date range</strong> above.
                      </>
                    ) : (
                      <> (all time for that truck).</>
                    )}{" "}
                    Bars count <strong>distinct customer emails</strong> by
                    ethnicity.
                  </>
                ) : (
                  <>
                    Summary: <strong>{stats?.totalUsers ?? 0}</strong> users.{" "}
                    <strong>{usersWithEthnicity}</strong> with a recorded
                    ethnicity
                    {stats?.ethnicityUnspecified > 0 && (
                      <>
                        ; <strong>{stats.ethnicityUnspecified}</strong> not
                        specified
                      </>
                    )}
                    .
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="report-table-search">Search table rows</Label>
                <Input
                  id="report-table-search"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search users in table below..."
                />
              </div>
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
              {ethnicityUsersTable}
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
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search menu items in table below..."
                  />
                </div>
                {menuItemsDetailTable}
              </>
            }
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
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search ingredients in table below..."
                  />
                </div>
                {ingredientsDetailTable}
              </>
            }
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
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search orders in table below..."
                  />
                </div>
                {ordersDetailTable}
              </>
            }
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
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search sold items in table below..."
                  />
                </div>
                {orderLineItemsDetailTable}
              </>
            }
          />
        )}

        {activeReport === "totalMoneyMade" && (
          <ReportBarChartCard
            title="Total money made (by month)"
            total={stats != null ? `$${money(stats.grossIncome)}` : "—"}
            summary={`Gross income from non-cancelled and non-refunded orders, grouped by month.${orderFilterActive ? " Includes only the selected date range." : ""}`}
            chartData={grossIncomeByMonthChartData}
            valueLabel="Gross income ($)"
            emptyMessage="No revenue data for the current filters."
            yAxisWidth={110}
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search orders in table below..."
                  />
                </div>
                {grossIncomeOrdersDetailTable}
              </>
            }
          />
        )}

        {activeReport === "orderFinalStatus" && (
          <ReportBarChartCard
            title="Final status of orders"
            total={stats?.totalOrders}
            summary="Each bar shows how many orders ended in that final order status."
            chartData={orderFinalStatusChartData}
            valueLabel="Orders"
            emptyMessage="No orders available for the current filters."
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search orders in table below..."
                  />
                </div>
                {ordersDetailTable}
              </>
            }
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
            detail={
              <>
                <div className="max-w-md">
                  <Label htmlFor="report-table-search">Search table rows</Label>
                  <Input
                    id="report-table-search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search truck orders in table below..."
                  />
                </div>
                {ordersDetailTable}
              </>
            }
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
