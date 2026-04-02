import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Truck, Calendar } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

export const Route = createFileRoute("/employee/orders")({
  component: OrdersPage,
});

const STATUS_COLORS = {
  pending:   "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
  preparing: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  ready:     "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

function formatDateTime(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return d.toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function OrdersPage() {
  const token = localStorage.getItem("token");

  // Decode role from JWT
  let role = null;
  try {
    role = JSON.parse(atob(token.split(".")[1]))?.role ?? null;
  } catch {}

  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  useEffect(() => {
    if (role !== "admin") return;
    fetch("/api/trucks", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTrucks(list);
        if (list.length > 0) setSelectedTruck(list[0].license_plate);
      })
      .catch(() => {});
  }, [role]);

  const {
    currentOrders, scheduledOrders, pastOrders,
    search, setSearch,
    filterDate, setFilterDate,
    showCompleted, setShowCompleted,
    showCancelled, setShowCancelled,
    page, setPage, totalPages,
    loading,
    refreshCurrent, refreshPast,
  } = useOrders({ token, selectedTruck });

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        {role === "admin" && trucks.length > 0 && (
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-muted-foreground" />
            <select
              value={selectedTruck ?? ""}
              onChange={(e) => setSelectedTruck(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {trucks.map((t) => (
                <option key={t.license_plate} value={t.license_plate}>
                  {t.truck_name} — {t.current_location ?? t.license_plate}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Tabs defaultValue="current">
        <TabsList className="mb-6">
          <TabsTrigger value="current">
            Current Orders
            {currentOrders.length > 0 && (
              <span className="ml-2 bg-amber-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {currentOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled
            {scheduledOrders.length > 0 && (
              <span className="ml-2 bg-yellow-500 dark:bg-yellow-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {scheduledOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">Past Orders</TabsTrigger>
        </TabsList>

        {/* ── Current Orders ── */}
          <TabsContent value="current">
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <RefreshCw size={11} />
            Auto-refreshes every 10s
          </div>
          <OrderList
            orders={currentOrders}
            loading={loading}
            showActions
            token={token}
            refreshCurrent={refreshCurrent}
            refreshPast={refreshPast}
          />
        </TabsContent>

        {/* ── Scheduled Orders ── */}
          <TabsContent value="scheduled">
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <RefreshCw size={11} />
            Auto-refreshes every 10s
          </div>
          <OrderList
            orders={scheduledOrders}
            loading={loading}
            showActions
            token={token}
            refreshCurrent={refreshCurrent}
            refreshPast={refreshPast}
          />
        </TabsContent>

        {/* ── Past Orders ── */}
        <TabsContent value="past">
          {/* Filters row */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order # or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date picker */}
            <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 bg-background">
              <Calendar size={14} className="text-muted-foreground" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-sm focus:outline-none bg-transparent"
              />
            </div>

            {/* Status checkboxes */}
            <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="accent-green-600 w-4 h-4"
              />
              <span className="text-foreground">Completed</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="accent-red-500 w-4 h-4"
              />
              <span className="text-foreground">Cancelled</span>
            </label>
          </div>

          <OrderList orders={pastOrders} loading={loading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderList({ orders, loading, showActions = false, token, refreshCurrent, refreshPast }) {
  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading...</p>;
  if (orders.length === 0) return <p className="text-muted-foreground py-8 text-center">No orders found.</p>;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.checkout_id}
          order={order}
          showActions={showActions}
          token={token}
          refreshCurrent={refreshCurrent}
          refreshPast={refreshPast}
        />
      ))}
    </div>
  );
}

function OrderCard({ order, showActions, token, refreshCurrent, refreshPast }) {
  const [updating, setUpdating] = useState(false);

  const isReady     = order.order_status === "ready";
  const isPreparing = order.order_status === "preparing";

  const scheduledLabel = order.scheduled_time
    ? new Date(order.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const createdLabel = formatDateTime(order.date_created);

  const handleUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await fetch(`/api/orders/${order.checkout_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      refreshCurrent?.();
      if (newStatus === "completed" || newStatus === "cancelled") refreshPast?.();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card
      className={`shadow-sm transition-all ${
        isReady     ? "ring-2 ring-green-400 dark:ring-green-600 bg-green-50/40 dark:bg-green-950/20" :
        isPreparing ? "ring-2 ring-blue-300 dark:ring-blue-600 bg-blue-50/30 dark:bg-blue-950/20"  : ""
      }`}
    >
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-0.5">Transaction ID</p>
            <CardTitle className="text-sm font-semibold">#{order.checkout_id}</CardTitle>
          </div>
          <div className="w-px h-6 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-0.5">Order #</p>
            <p className="text-sm font-semibold">{order.order_number}</p>
          </div>
          {createdLabel && (
            <>
              <div className="w-px h-6 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">Date & Time</p>
                <p className="text-sm font-medium text-foreground">{createdLabel}</p>
              </div>
            </>
          )}
          {order.truck_location && (
            <>
              <div className="w-px h-6 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">Location</p>
                <p className="text-sm font-medium text-foreground">{order.truck_location}</p>
              </div>
            </>
          )}
          {(isReady || isPreparing) && (
            <span className={`text-xs font-medium flex items-center gap-1 ${isReady ? "text-green-600 dark:text-green-400" : "text-blue-500 dark:text-blue-400"}`}>
              ● {isReady ? "Ready" : "Priority"}
            </span>
          )}
        </div>
        <Badge className={`text-xs font-medium border ${STATUS_COLORS[order.order_status] ?? "bg-muted text-muted-foreground"}`}>
          {order.order_status}
        </Badge>
      </CardHeader>

      <CardContent className="py-2 px-4 text-sm text-foreground">
        {/* Order items — large and clear for cooks */}
        {order.items && (
          <ul className="mb-4 space-y-1">
            {order.items.split(", ").map((item, i) => {
              const match = item.match(/^(\d+)x\s+(.+)$/);
              const qty  = match ? match[1] : "?";
              const name = match ? match[2] : item;
              return (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-amber-600 font-bold text-base w-8 shrink-0">{qty}×</span>
                  <span className="text-base font-semibold text-foreground">{name}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Order meta */}
        <div className="flex gap-4 flex-wrap pt-1 border-t border-border text-muted-foreground">
          <span className="capitalize">{order.order_type?.replace("-", " ")}</span>
          <span className="font-medium text-foreground">${parseFloat(order.total_price).toFixed(2)}</span>
          <span>{order.payment_method}</span>
          {scheduledLabel && (
            <span className="text-amber-600 font-medium">Pickup: {scheduledLabel}</span>
          )}
          {order.customer_email && (
            <span>
              {order.customer_email}
              {order.customer_phone && ` · ${order.customer_phone}`}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 mt-3">
            {isPreparing && (
              <button
                onClick={() => handleUpdate("ready")}
                disabled={updating}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                Mark Ready
              </button>
            )}
            {isReady && (
              <button
                onClick={() => handleUpdate("completed")}
                disabled={updating}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50"
              >
                Mark Completed
              </button>
            )}
            <button
              onClick={() => handleUpdate("cancelled")}
              disabled={updating}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
