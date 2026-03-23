import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw } from "lucide-react";

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

  // Auto-refresh current orders every 10s
  useEffect(() => {
    const id = setInterval(fetchCurrentOrders, 10_000);
    return () => clearInterval(id);
  }, [fetchCurrentOrders]);

  // Re-fetch past orders when search changes (debounced 300ms)
  useEffect(() => {
    const timer = setTimeout(() => fetchPastOrders(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchPastOrders]);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

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
          <OrderList orders={currentOrders} loading={loading} />
        </TabsContent>

        <TabsContent value="past">
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
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

function OrderList({ orders, loading }) {
  if (loading) {
    return <p className="text-gray-400 py-8 text-center">Loading...</p>;
  }
  if (orders.length === 0) {
    return <p className="text-gray-400 py-8 text-center">No orders found.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.checkout_id} className="shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              #{order.order_number}
            </CardTitle>
            <Badge
              className={`text-xs font-medium border ${STATUS_COLORS[order.order_status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {order.order_status}
            </Badge>
          </CardHeader>
          <CardContent className="py-2 px-4 text-sm text-gray-600 flex gap-6 flex-wrap">
            <span className="capitalize">{order.order_type?.replace("-", " ")}</span>
            <span className="font-medium">${parseFloat(order.total_price).toFixed(2)}</span>
            <span>{order.payment_method}</span>
            {order.customer_email && (
              <span className="text-gray-400">{order.customer_email}</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
