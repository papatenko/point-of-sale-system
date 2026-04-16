import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getOrders, updateOrderStatus } from "@/services/orders";

export const Route = createFileRoute("/orders")({
  component: CustomerOrdersPage,
});

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
  preparing: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  ready: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
};

const STATUS_LABEL = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDateTime(raw, isUtc = false) {
  if (!raw) return null;
  const iso = typeof raw === "string"
    ? raw.replace(" ", "T") + (isUtc ? "Z" : "")
    : raw;
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const items = order.items ? order.items.split(" | ") : [];
  const scheduledLabel = order.scheduled_time
    ? formatDateTime(order.scheduled_time, false)
    : null;
  const createdLabel = formatDateTime(order.date_created, true);

  return (
    <div className="border border-border rounded-xl p-5 bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Order #</p>
            <p className="font-semibold text-foreground">{order.order_number}</p>
          </div>
          {createdLabel && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Placed</p>
              <p className="font-medium text-foreground">{createdLabel}</p>
            </div>
          )}
          {scheduledLabel && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Pickup</p>
              <p className="font-medium text-amber-600">{scheduledLabel}</p>
            </div>
          )}
          {order.truck_location && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
              <p className="font-medium text-foreground">{order.truck_location}</p>
            </div>
          )}
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.order_status] ?? "bg-muted text-muted-foreground border-border"}`}
        >
          {STATUS_LABEL[order.order_status] ?? order.order_status}
        </span>
      </div>

      {/* Items */}
      {items.length > 0 && (
        <ul className="space-y-1 mb-4">
          {items.map((item, i) => {
            const match = item.match(/^(\d+)x\s+(.+)$/);
            const qty = match ? match[1] : "?";
            const name = match ? match[2] : item;
            return (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="text-amber-600 font-bold w-6 shrink-0">{qty}×</span>
                <span className="text-foreground font-medium">{name}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-sm text-muted-foreground">
        <span className="capitalize">{order.order_type?.replace("-", " ")}</span>
        <span className="font-semibold text-foreground text-base">
          ${parseFloat(order.total_price).toFixed(2)}
        </span>
      </div>

      {order.order_status === "cancelled" && order.cancel_reason && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          Reason: {order.cancel_reason}
        </p>
      )}

      {order.order_status === "pending" && onCancel && (
        <div className="pt-3">
          <button
            onClick={async () => {
              setCancelling(true);
              try { await onCancel(order.checkout_id); }
              finally { setCancelling(false); }
            }}
            disabled={cancelling}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}
    </div>
  );
}

function CustomerOrdersPage() {
  const navigate = useNavigate();

  // Active orders
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeLoading, setActiveLoading] = useState(true);

  // Past orders
  const [pastOrders, setPastOrders] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const showCompleted = true;
  const showCancelled = true;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate({ to: "/auth/login" });
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const data = await getOrders({ status: "pending,preparing,ready" });
      setActiveOrders(Array.isArray(data) ? data : []);
    } catch {
      setActiveOrders([]);
    } finally {
      setActiveLoading(false);
    }
  }, []);

  const fetchPast = useCallback(async () => {
    const statuses = [
      ...(showCompleted ? ["completed"] : []),
      ...(showCancelled ? ["cancelled"] : []),
    ];
    if (statuses.length === 0) {
      setPastOrders([]);
      setTotalPages(1);
      setPastLoading(false);
      return;
    }
    try {
      const params = { status: statuses.join(","), page };
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;
      const data = await getOrders(params);
      setPastOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalPages(data.pages ?? 1);
    } catch {
      setPastOrders([]);
    } finally {
      setPastLoading(false);
    }
  }, [showCompleted, showCancelled, filterDateFrom, filterDateTo, page]);

  // Initial fetch
  useEffect(() => { fetchActive(); }, [fetchActive]);
  useEffect(() => { fetchPast(); }, [fetchPast]);

  // Auto-refresh active orders every 10s
  useEffect(() => {
    const id = setInterval(fetchActive, 10_000);
    return () => clearInterval(id);
  }, [fetchActive]);

  // Reset page when date filters change
  useEffect(() => { setPage(1); }, [filterDateFrom, filterDateTo]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-8">My Orders</h1>

      {/* Active Orders */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-4">Active Orders</h2>
        {activeLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-sm">No active orders.</p>
            <Link
              to="/order"
              className="inline-block mt-3 text-sm text-amber-600 hover:underline font-medium"
            >
              Order now →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((o) => (
              <OrderCard
                key={o.checkout_id}
                order={o}
                onCancel={async (id) => {
                  await updateOrderStatus(id, "cancelled", "Customer Request");
                  fetchActive();
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Order History */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-foreground">Order History</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {pastLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : pastOrders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-sm">No past orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastOrders.map((o) => (
              <OrderCard key={o.checkout_id} order={o} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
