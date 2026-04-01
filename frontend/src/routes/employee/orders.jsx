import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Truck } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

export const Route = createFileRoute("/employee/orders")({
  component: OrdersPage,
});

const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  preparing: "bg-blue-100 text-blue-800 border-blue-200",
  ready:     "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function OrdersPage() {
  const token = localStorage.getItem("token");

  // Decode role from JWT
  let role = null;
  try {
    role = JSON.parse(atob(token.split(".")[1]))?.role ?? null;
  } catch {}

  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  // Admin fetches all trucks and can switch between them
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

  const { currentOrders, pastOrders, search, setSearch, loading, refreshCurrent, refreshPast } =
    useOrders({ token, selectedTruck });

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        {role === "admin" && trucks.length > 0 && (
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-gray-400" />
            <select
              value={selectedTruck ?? ""}
              onChange={(e) => setSelectedTruck(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
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
          <TabsTrigger value="past">Past Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
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

        <TabsContent value="past">
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <OrderList orders={pastOrders} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderList({ orders, loading, showActions = false, token, refreshCurrent, refreshPast }) {
  if (loading) return <p className="text-gray-400 py-8 text-center">Loading...</p>;
  if (orders.length === 0) return <p className="text-gray-400 py-8 text-center">No orders found.</p>;

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
      refreshCurrent();
      if (newStatus === "completed" || newStatus === "cancelled") refreshPast();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card
      className={`shadow-sm transition-all ${
        isReady     ? "ring-2 ring-green-400 bg-green-50/40" :
        isPreparing ? "ring-2 ring-blue-300 bg-blue-50/30"  : ""
      }`}
    >
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">
            #{order.order_number}
          </CardTitle>
          {(isReady || isPreparing) && (
            <span className={`text-xs font-medium flex items-center gap-1 ${isReady ? "text-green-600" : "text-blue-500"}`}>
              ● {isReady ? "Ready" : "Priority"}
            </span>
          )}
        </div>
        <Badge className={`text-xs font-medium border ${STATUS_COLORS[order.order_status] ?? "bg-gray-100 text-gray-600"}`}>
          {order.order_status}
        </Badge>
      </CardHeader>

      <CardContent className="py-2 px-4 text-sm text-gray-600">
        {/* Order items — shown first, large and clear for cooks */}
        {order.items && (
          <ul className="mb-4 space-y-1">
            {order.items.split(", ").map((item, i) => {
              const match = item.match(/^(\d+)x\s+(.+)$/);
              const qty  = match ? match[1] : "?";
              const name = match ? match[2] : item;
              return (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-amber-600 font-bold text-base w-8 shrink-0">{qty}×</span>
                  <span className="text-base font-semibold text-gray-900">{name}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Order meta — separated by a divider */}
        <div className="flex gap-4 flex-wrap pt-1 border-t border-gray-100 text-gray-500">
          <span className="capitalize">{order.order_type?.replace("-", " ")}</span>
          <span className="font-medium text-gray-700">${parseFloat(order.total_price).toFixed(2)}</span>
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
                className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                Mark Completed
              </button>
            )}
            <button
              onClick={() => handleUpdate("cancelled")}
              disabled={updating}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
