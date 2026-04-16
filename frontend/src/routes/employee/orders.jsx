import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Truck, Calendar, AlertTriangle, X, Plus, Minus } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { formatDateTime } from "@/utils/format";
import { getTrucks } from "@/services/trucks";
import { updateOrderStatus, updateOrderItems, getOrder } from "@/services/orders";

export const Route = createFileRoute("/employee/orders")({
  component: OrdersPage,
});

const STATUS_COLORS = {
  pending:
    "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
  preparing:
    "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  ready:
    "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled:
    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
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

  useEffect(() => {
    if (role !== "admin") return;
    getTrucks()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTrucks(list);
        if (list.length > 0) setSelectedTruck(list[0].license_plate);
      })
      .catch(() => {});
  }, [role]);

  const {
    currentOrders,
    scheduledOrders,
    pastOrders,
    search,
    setSearch,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    showCompleted,
    setShowCompleted,
    showCancelled,
    setShowCancelled,
    page,
    setPage,
    totalPages,
    loading,
    refreshCurrent,
    refreshPast,
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
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by order # or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 bg-background">
              <Calendar size={14} className="text-muted-foreground shrink-0" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="text-sm focus:outline-none bg-transparent"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
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

function OrderList({
  orders,
  loading,
  showActions = false,
  token,
  refreshCurrent,
  refreshPast,
}) {
  if (loading)
    return <p className="text-muted-foreground py-8 text-center">Loading...</p>;
  if (orders.length === 0)
    return (
      <p className="text-muted-foreground py-8 text-center">No orders found.</p>
    );

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

function EditOrderModal({ order, onClose, onSaved }) {
  const [menuItems, setMenuItems] = useState([]);
  const [editItems, setEditItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getOrder(order.checkout_id),
      fetch("/api/menu-items").then((r) => r.json()),
    ])
      .then(([fullOrder, menu]) => {
        setEditItems(
          (fullOrder.items || []).map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            quantity: i.quantity,
          })),
        );
        setMenuItems(Array.isArray(menu) ? menu : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateQty = (idx, delta) =>
    setEditItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it,
      ),
    );

  const removeItem = (idx) =>
    setEditItems((prev) => prev.filter((_, i) => i !== idx));

  const addItem = (menuItemId) => {
    const mi = menuItems.find((m) => m.menu_item_id === parseInt(menuItemId));
    if (!mi) return;
    const existing = editItems.findIndex((i) => i.menuItemId === mi.menu_item_id);
    if (existing >= 0) {
      setEditItems((prev) =>
        prev.map((it, i) =>
          i === existing ? { ...it, quantity: it.quantity + 1 } : it,
        ),
      );
    } else {
      setEditItems((prev) => [
        ...prev,
        { menuItemId: mi.menu_item_id, name: mi.item_name, quantity: 1 },
      ]);
    }
  };

  const handleSave = async () => {
    if (editItems.length === 0) return;
    setSaving(true);
    try {
      await updateOrderItems(
        order.checkout_id,
        editItems.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      );
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-foreground">
            Edit Order #{order.order_number}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            Loading...
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {editItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-1 border-b border-border last:border-0"
                >
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(idx, -1)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(idx, 1)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addItem(e.target.value);
                e.target.value = "";
              }}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
            >
              <option value="" disabled>
                + Add item...
              </option>
              {menuItems.map((m) => (
                <option key={m.menu_item_id} value={m.menu_item_id}>
                  {m.item_name} — ${parseFloat(m.price).toFixed(2)}
                </option>
              ))}
            </select>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || editItems.length === 0}
                className="px-4 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CANCEL_REASONS = [
  "Customer Request",
  "Out of Stock",
  "Duplicate Order",
  "Payment Issue",
  "Kitchen Error",
  "Other",
];

function CancelReasonModal({ orderNumber, onClose, onConfirm }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(reason);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-foreground">
            Cancel Order #{orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Select a reason for cancellation:
        </p>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400 mb-5"
        >
          {CANCEL_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            {confirming ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, showActions, token, refreshCurrent, refreshPast }) {
  const [updating, setUpdating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isReady = order.order_status === "ready";
  const isPreparing = order.order_status === "preparing";
  const isPending = order.order_status === "pending";

  const scheduledLabel = order.scheduled_time
    ? new Date(order.scheduled_time.replace(" ", "T")).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const createdLabel = formatDateTime(order.date_created);

  const handleUpdate = async (newStatus, cancelReason = null) => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.checkout_id, newStatus, cancelReason);
      refreshCurrent?.();
      if (newStatus === "completed" || newStatus === "cancelled")
        refreshPast?.();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card
      className={`shadow-sm transition-all ${
        isReady
          ? "ring-2 ring-green-400 dark:ring-green-600 bg-green-50/40 dark:bg-green-950/20"
          : isPreparing
            ? "ring-2 ring-blue-300 dark:ring-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
            : ""
      }`}
    >
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-0.5">
              Transaction ID
            </p>
            <CardTitle className="text-sm font-semibold">
              #{order.checkout_id}
            </CardTitle>
          </div>
          <div className="w-px h-6 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-0.5">
              Order #
            </p>
            <p className="text-sm font-semibold">{order.order_number}</p>
          </div>
          {scheduledLabel && (
            <>
              <div className="w-px h-6 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">
                  Scheduled Pickup
                </p>
                <p className="text-sm font-medium text-amber-600">
                  {scheduledLabel}
                </p>
              </div>
            </>
          )}
          {createdLabel && (
            <>
              <div className="w-px h-6 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">
                  Order Placed
                </p>
                <p className="text-sm font-medium text-foreground">
                  {createdLabel}
                </p>
              </div>
            </>
          )}
          {order.truck_location && (
            <>
              <div className="w-px h-6 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">
                  Location
                </p>
                <p className="text-sm font-medium text-foreground">
                  {order.truck_location}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!!order.inventory_warning && !["completed", "cancelled"].includes(order.order_status) && (
            <div className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
              <AlertTriangle size={12} />
              Low Stock: {order.inventory_warning.split(" | ").join(", ")}
            </div>
          )}
          {!!order.expired_warning && !["completed", "cancelled"].includes(order.order_status) && (
            <div className="flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-full px-2 py-0.5">
              <AlertTriangle size={12} />
              Expired Ingredients: {order.expired_warning.split(" | ").join(", ")}
            </div>
          )}
          <Badge
            className={`text-xs font-medium border ${STATUS_COLORS[order.order_status] ?? "bg-muted text-muted-foreground"}`}
          >
            {order.order_status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-2 px-4 text-sm text-foreground">
        {/* Order items — large and clear for cooks */}
        {order.items && (
          <ul className="mb-4 space-y-1">
            {order.items.split(" | ").map((item, i) => {
              const match = item.match(/^(\d+)x\s+(.+)$/);
              const qty = match ? match[1] : "?";
              const name = match ? match[2] : item;
              return (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-amber-600 font-bold text-base w-8 shrink-0">
                    {qty}×
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Order meta */}
        <div className="flex gap-4 flex-wrap pt-1 border-t border-border text-muted-foreground">
          <span className="capitalize">
            {order.order_type?.replace("-", " ")}
          </span>
          <span className="font-medium text-foreground">
            ${parseFloat(order.total_price).toFixed(2)}
          </span>
          <span>{order.payment_method}</span>

          {order.customer_email && (
            <span>
              {order.customer_email}
              {order.customer_phone && ` · ${order.customer_phone}`}
            </span>
          )}

          {order.cashier_email && (
            <span>
              Cashier:{" "}
              {order.cashier_first_name
                ? `${order.cashier_first_name} ${order.cashier_last_name}`
                : order.cashier_email}
            </span>
          )}

          {order.order_status === "cancelled" && order.cancel_reason && (
            <span className="text-red-500 dark:text-red-400">
              Cancel Reason: {order.cancel_reason}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {isPending && (
              <>
                {!order.inventory_warning && !order.expired_warning && (
                  <button
                    onClick={() => handleUpdate("preparing")}
                    disabled={updating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Mark Preparing
                  </button>
                )}
                <button
                  onClick={() => setShowEdit(true)}
                  disabled={updating}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted font-medium transition-colors disabled:opacity-50"
                >
                  Edit Order
                </button>
              </>
            )}
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
            {(isPending || isPreparing) && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={updating}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {showEdit && (
          <EditOrderModal
            order={order}
            onClose={() => setShowEdit(false)}
            onSaved={() => refreshCurrent?.()}
          />
        )}

        {showCancelModal && (
          <CancelReasonModal
            orderNumber={order.order_number}
            onClose={() => setShowCancelModal(false)}
            onConfirm={async (reason) => {
              await handleUpdate("cancelled", reason);
              setShowCancelModal(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
