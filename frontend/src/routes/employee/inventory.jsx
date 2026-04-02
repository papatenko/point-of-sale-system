import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  PackageIcon, AlertTriangleIcon, CheckCircle2Icon,
  TruckIcon, MinusCircleIcon, ShoppingCartIcon, HistoryIcon,
  BellIcon, SearchIcon, RefreshCwIcon, XCircleIcon, Trash2Icon,
  ChevronDownIcon, ChevronUpIcon,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";

export const Route = createFileRoute("/employee/inventory")({
  component: InventoryPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? "—" : parseFloat(n).toFixed(2));

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };
  return { toast, show };
}

function isManagerOrAdmin(user) {
  return user?.role === "manager" || user?.role === "admin";
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ item }) {
  if (item.quantityOnHand === 0)
    return <Badge variant="destructive">Out of Stock</Badge>;
  if (item.needsReorder)
    return <Badge variant="destructive" className="bg-orange-500 dark:bg-orange-600 hover:bg-orange-500 dark:hover:bg-orange-600">Below Threshold</Badge>;
  const ratio = item.reorderThreshold > 0 ? item.quantityOnHand / item.reorderThreshold : 2;
  if (ratio < 1.5)
    return <Badge variant="warning">Running Low</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}

// ─── Expiry Badge ─────────────────────────────────────────────────────────────
function ExpiryBadge({ date }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  const days = Math.floor((new Date(date) - new Date()) / 86_400_000);
  if (days < 0)  return <Badge variant="destructive">Expired</Badge>;
  if (days <= 3) return <Badge variant="destructive" className="bg-orange-500 dark:bg-orange-600 hover:bg-orange-500 dark:hover:bg-orange-600">{days}d left</Badge>;
  if (days <= 7) return <Badge variant="warning">{days}d left</Badge>;
  return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span>;
}

// ─── Quantity Bar ─────────────────────────────────────────────────────────────
function QuantityBar({ item }) {
  const ratio = item.reorderThreshold > 0
    ? Math.min(item.quantityOnHand / (item.reorderThreshold * 2), 1)
    : 1;
  const fillColor =
    item.quantityOnHand === 0 ? "bg-destructive"
    : item.needsReorder       ? "bg-accent"
    : ratio < 0.75            ? "bg-primary"
    : "bg-primary";
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <span className="font-semibold tabular-nums text-sm">
        {fmt(item.quantityOnHand)}{" "}
        <span className="text-muted-foreground font-normal">{item.unitOfMeasure}</span>
      </span>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, variant = "default" }) {
  const colorMap = {
    default: "text-foreground",
    danger:  "text-destructive",
    warning: "text-accent",
    success: "text-primary",
  };
  return (
    <Card>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${colorMap[variant]}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-muted ${colorMap[variant]}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingRows({ count = 5 }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 w-full rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// ─── Receive Order Dialog ─────────────────────────────────────────────────────
// Shown when a manager/admin clicks "Receive" on a pending supply order.
function ReceiveOrderDialog({ order, open, onOpenChange, onConfirm, loading }) {
  const [received, setReceived] = useState({});
  const [itemsExpanded, setItemsExpanded] = useState(true);

  // Pre-fill with quantity_ordered each time a new order is opened
  useEffect(() => {
    if (open && order) {
      const initial = {};
      for (const item of order.items) {
        initial[item.poItemId] = item.quantityOrdered;
      }
      setReceived(initial);
    }
  }, [open, order]);

  if (!order) return null;

  const handleQtyChange = (poItemId, value) => {
    const num = parseFloat(value);
    setReceived((prev) => ({ ...prev, [poItemId]: isNaN(num) ? 0 : num }));
  };

  const handleConfirm = () => {
    const items = order.items.map((item) => ({
      poItemId:         item.poItemId,
      ingredientId:     item.ingredientId,
      quantityReceived: received[item.poItemId] ?? 0,
    }));
    onConfirm({ poId: order.poId, items });
  };

  const totalReceived = Object.values(received)
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="size-5 text-emerald-600" />
            Receive Supply Order — PO-{order.poId}
          </DialogTitle>
          <DialogDescription>
            Confirm the quantities actually delivered. Truck inventory will be
            restocked immediately and any open reorder alerts will be resolved.
          </DialogDescription>
        </DialogHeader>

        {/* Order meta */}
        <div className="rounded-lg border bg-muted/40 divide-y text-sm">
          {[
            { label: "Supplier",   value: order.supplierName },
            { label: "Created by", value: order.createdBy },
            { label: "Status",     value: order.status },
            { label: "Total cost", value: `$${fmt(order.totalCost)}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-3 py-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>

        {/* Line items */}
        <div className="grid gap-1.5">
          <button
            type="button"
            className="flex items-center justify-between text-sm font-semibold hover:text-foreground/80 transition-colors"
            onClick={() => setItemsExpanded((e) => !e)}
          >
            <span>Items to receive ({order.items.length})</span>
            {itemsExpanded
              ? <ChevronUpIcon className="size-4" />
              : <ChevronDownIcon className="size-4" />}
          </button>

          {itemsExpanded && (
            <div className="rounded-lg border divide-y max-h-56 overflow-y-auto">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-muted/60 text-xs text-muted-foreground font-medium">
                <span>Ingredient</span>
                <span className="text-right">Ordered</span>
                <span className="text-right w-24">Qty Received</span>
              </div>

              {order.items.map((item) => (
                <div
                  key={item.poItemId}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.ingredientName}</p>
                    <p className="text-xs text-muted-foreground">{item.unitOfMeasure}</p>
                  </div>
                  <span className="tabular-nums text-muted-foreground text-right">
                    {fmt(item.quantityOrdered)}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={received[item.poItemId] ?? ""}
                    onChange={(e) => handleQtyChange(item.poItemId, e.target.value)}
                    className="w-24 text-right h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restock summary */}
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm flex justify-between items-center">
          <span className="text-emerald-800 font-medium">Total units being restocked</span>
          <span className="text-emerald-700 font-bold tabular-nums">{fmt(totalReceived)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || totalReceived <= 0}
            className="gap-2"
          >
            <CheckCircle2Icon className="size-4" />
            {loading ? "Processing…" : "Confirm Receipt & Restock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pending Supply Orders Banner (managers / admins only) ────────────────────
function PendingSupplyOrdersBanner({ selectedTruck, onOrderReceived, showToast }) {
  const user = useSelector((s) => s.auth.user);
  const [orders,         setOrders]         = useState([]);
  const [bannerLoading,  setBannerLoading]  = useState(false);
  const [activeOrder,    setActiveOrder]    = useState(null);
  const [receiveLoading, setReceiveLoading] = useState(false);

  const loadPendingOrders = useCallback(async () => {
    if (!isManagerOrAdmin(user) || !selectedTruck) return;
    setBannerLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/inventory/pending-orders?licensePlate=${encodeURIComponent(selectedTruck)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
    setBannerLoading(false);
  }, [selectedTruck, user]);

  useEffect(() => {
    loadPendingOrders();
  }, [loadPendingOrders]);

  const handleConfirmReceive = async ({ poId, items }) => {
    setReceiveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory/receive-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ poId, licensePlate: selectedTruck, items }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");

      showToast(`✓ PO-${poId} received — inventory restocked and alerts resolved.`);
      setActiveOrder(null);
      await loadPendingOrders(); // refresh banner
      onOrderReceived();         // refresh parent inventory table
    } catch (err) {
      showToast(err.message, "error");
    }
    setReceiveLoading(false);
  };

  if (!isManagerOrAdmin(user) || bannerLoading || orders.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/25 px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <TruckIcon className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-900 dark:text-blue-200 leading-tight">
              {orders.length} pending supply order{orders.length > 1 ? "s" : ""} awaiting receipt
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              Confirm delivery quantities to restock inventory and resolve reorder alerts automatically.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.poId}
              className="flex items-center justify-between gap-3 rounded-lg bg-white/70 dark:bg-white/5 border border-blue-100 dark:border-blue-800/30 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">PO-{order.poId}</span>
                  <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                    {order.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{order.supplierName}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.items.length} ingredient{order.items.length !== 1 ? "s" : ""}
                  {" · "}${fmt(order.totalCost)}
                  {" · "}ordered by {order.createdBy}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setActiveOrder(order)}
              >
                <PackageIcon className="size-3.5" />
                Receive
              </Button>
            </div>
          ))}
        </div>
      </div>

      <ReceiveOrderDialog
        order={activeOrder}
        open={!!activeOrder}
        onOpenChange={(o) => { if (!o) setActiveOrder(null); }}
        onConfirm={handleConfirmReceive}
        loading={receiveLoading}
      />
    </>
  );
}

// Removed UseMenuItemDialog and DailyProductionDialog components

// ─── Expire Confirmation Dialog ───────────────────────────────────────────────
function ExpireDialog({ open, onOpenChange, expiredItems, onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2Icon className="size-5" />
            Expire Outdated Inventory
          </DialogTitle>
          <DialogDescription>
            The following items have passed their expiration date. Their quantities
            will be set to 0 and logged as waste.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          {expiredItems.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-muted-foreground gap-2">
              <CheckCircle2Icon className="size-8 text-emerald-500 opacity-70" />
              <p className="text-sm font-medium text-foreground">No expired items</p>
              <p className="text-xs">All items are within their expiration dates.</p>
            </div>
          ) : (
            <div className="rounded-lg border divide-y max-h-64 overflow-y-auto">
              {expiredItems.map((item) => (
                <div key={item.ingredientId} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{item.ingredientName}</p>
                    <p className="text-xs text-muted-foreground">
                      Expired {new Date(item.expirationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-destructive tabular-nums">
                      {fmt(item.quantityOnHand)}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">{item.unitOfMeasure}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {expiredItems.length > 0 && (
            <Button variant="destructive" disabled={loading} onClick={onConfirm}>
              {loading ? "Expiring…" : `Expire ${expiredItems.length} item${expiredItems.length > 1 ? "s" : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manual Adjust Dialog ─────────────────────────────────────────────────────
function AdjustDialog({ item, open, onOpenChange, onConfirm, loading }) {
  const [qty,    setQty]    = useState("");
  const [type,   setType]   = useState("waste");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) { setQty(""); setType("waste"); setReason(""); }
  }, [open]);

  const invalid = !qty || parseFloat(qty) <= 0 || parseFloat(qty) > (item?.quantityOnHand ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Inventory Adjustment</DialogTitle>
          <DialogDescription>
            {item?.ingredientName} — currently{" "}
            <strong>{fmt(item?.quantityOnHand)} {item?.unitOfMeasure}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Adjustment type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order-deduction">Used in cooking</SelectItem>
                <SelectItem value="waste">Waste / Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              Quantity to deduct ({item?.unitOfMeasure})
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={item?.quantityOnHand}
              placeholder="0.00"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            {qty && parseFloat(qty) > (item?.quantityOnHand ?? 0) && (
              <p className="text-xs text-destructive">
                Exceeds available stock ({fmt(item?.quantityOnHand)} {item?.unitOfMeasure})
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              Reason{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              placeholder="e.g. spillage, spoilage, manual correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={loading || invalid}
            onClick={() => onConfirm({ qty: parseFloat(qty), type, reason })}
          >
            {loading ? "Saving…" : "Confirm Deduction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reorder Dialog ───────────────────────────────────────────────────────────
function ReorderDialog({ item, open, onOpenChange, onConfirm, loading }) {
  const [qty, setQty] = useState("");
  const suggested = item
    ? Math.max(item.reorderThreshold * 3 - item.quantityOnHand, item.reorderThreshold).toFixed(2)
    : "0";
  useEffect(() => { if (open) setQty(suggested); }, [open, suggested]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place Reorder</DialogTitle>
          <DialogDescription>{item?.ingredientName}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="rounded-lg border bg-muted/50 divide-y">
            {[
              { label: "Current stock",       val: `${fmt(item?.quantityOnHand)} ${item?.unitOfMeasure}`,   cls: "text-orange-600 dark:text-orange-400" },
              { label: "Reorder threshold",   val: `${fmt(item?.reorderThreshold)} ${item?.unitOfMeasure}` },
              { label: "Suggested order qty", val: `${suggested} ${item?.unitOfMeasure}`,                   cls: "text-blue-600 dark:text-blue-400" },
            ].map(({ label, val, cls }) => (
              <div key={label} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-semibold tabular-nums ${cls ?? ""}`}>{val}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              Quantity to order ({item?.unitOfMeasure})
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={loading || !qty || parseFloat(qty) <= 0}
            onClick={() => onConfirm({ qty: parseFloat(qty) })}
          >
            {loading ? "Ordering…" : "Place Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function InventoryPage() {
  const authUser = useSelector((s) => s.auth.user);
  const currentUser = authUser?.email ?? "manager@example.com";

  const [trucks,        setTrucks]        = useState([]);
  const [selectedTruck, setSelectedTruck] = useState("");
  const [inventory,     setInventory]     = useState([]);
  const [alerts,        setAlerts]        = useState([]);
  const [history,       setHistory]       = useState([]);
  const [menuItems,     setMenuItems]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");

  // Dialogs
  const [adjustItem,              setAdjustItem]              = useState(null);
  const [reorderItem,             setReorderItem]             = useState(null);
  // Removed useMenuItemOpen and dailyProductionOpen
  const [expireItems,             setExpireItems]             = useState(null);
  const [hasShownWarningForTruck, setHasShownWarningForTruck] = useState(null);
  const [modalLoading,            setModalLoading]            = useState(false);
  const [expireLoading,           setExpireLoading]           = useState(false);
  const [productionLoading,       setProductionLoading]       = useState(false);

  // Pending supply orders notice (manager/admin only)
  const [pendingOrders,             setPendingOrders]             = useState([]);
  const [pendingOrdersNotice,       setPendingOrdersNotice]       = useState(null);
  const [hasShownPendingForTruck,   setHasShownPendingForTruck]   = useState(null);
  const [pendingActiveOrder,        setPendingActiveOrder]        = useState(null);
  const [pendingReceiveLoading,     setPendingReceiveLoading]     = useState(false);

  const { toast, show: showToast } = useToast();

  // Load trucks + menu items on mount
  useEffect(() => {
    if (authUser?.role === "admin") {
      fetch("/api/trucks")
        .then((r) => r.json())
        .then((data) => {
          setTrucks(data);
          if (data.length > 0) setSelectedTruck(data[0].license_plate);
        })
        .catch(() => showToast("Failed to load trucks", "error"));
    } else if (authUser?.license_plate) {
      // For manager/employee, use their assigned truck
      setTrucks([{ license_plate: authUser.license_plate, truck_name: `Truck ${authUser.license_plate}` }]);
      setSelectedTruck(authUser.license_plate);
    } else {
      setTrucks([]);
      setSelectedTruck("");
      showToast("No truck assigned to this user.", "error");
    }
    fetch("/api/menu-items")
      .then((r) => r.json())
      .then((data) => setMenuItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [authUser]);

  const loadData = useCallback(async (lp) => {
    if (!lp) return;
    setLoading(true);
    try {
      const [inv, alt, hist] = await Promise.all([
        fetch(`/api/inventory?licensePlate=${encodeURIComponent(lp)}`).then((r) => r.json()),
        fetch(`/api/inventory/alerts?licensePlate=${encodeURIComponent(lp)}`).then((r) => r.json()),
        fetch(`/api/inventory/history?licensePlate=${encodeURIComponent(lp)}&limit=50`).then((r) => r.json()),
      ]);
      setInventory(Array.isArray(inv)  ? inv  : []);
      setAlerts   (Array.isArray(alt)  ? alt  : []);
      setHistory  (Array.isArray(hist) ? hist : []);
    } catch {
      showToast("Failed to load inventory", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(selectedTruck); }, [selectedTruck, loadData]);

  // Auto-detect expired items
  useEffect(() => {
    if (inventory.length === 0 || loading) return;
    const expiredItems = inventory.filter((item) => {
      if (!item.expirationDate || item.quantityOnHand <= 0) return false;
      return new Date(item.expirationDate) < new Date();
    });
    if (expiredItems.length > 0 && expireItems === null && hasShownWarningForTruck !== selectedTruck) {
      setExpireItems(expiredItems);
      setHasShownWarningForTruck(selectedTruck);
    }
  }, [inventory, loading, selectedTruck, expireItems, hasShownWarningForTruck]);

  // Fetch pending supply orders for manager/admin
  useEffect(() => {
    if (!isManagerOrAdmin(authUser) || !selectedTruck) return;
    const token = localStorage.getItem("token");
    fetch(`/api/inventory/pending-orders?licensePlate=${encodeURIComponent(selectedTruck)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPendingOrders(Array.isArray(data) ? data : []))
      .catch(() => setPendingOrders([]));
  }, [selectedTruck, authUser]);

  // Auto-open pending supply orders notice (mirrors expired-items pattern)
  useEffect(() => {
    if (!isManagerOrAdmin(authUser) || loading || pendingOrders.length === 0) return;
    if (pendingOrdersNotice === null && hasShownPendingForTruck !== selectedTruck) {
      setPendingOrdersNotice(pendingOrders);
      setHasShownPendingForTruck(selectedTruck);
    }
  }, [pendingOrders, loading, selectedTruck, authUser, pendingOrdersNotice, hasShownPendingForTruck]);

  const handlePendingReceive = async ({ poId, items }) => {
    setPendingReceiveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory/receive-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ poId, licensePlate: selectedTruck, items }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      showToast(`✓ PO-${poId} received — inventory restocked.`);
      setPendingActiveOrder(null);
      setPendingOrders((prev) => prev.filter((o) => o.poId !== poId));
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setPendingReceiveLoading(false);
  };



  const handleAdjust = async ({ qty, type, reason }) => {
    setModalLoading(true);
    try {
      const res = await fetch("/api/inventory/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate:   selectedTruck,
          ingredientId:   adjustItem.ingredientId,
          quantityUsed:   qty,
          adjustmentType: type,
          reason,
          adjustedBy:     currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(
        `Updated. New qty: ${fmt(data.newQuantity)} ${adjustItem.unitOfMeasure}` +
        (data.alertCreated ? " — Reorder alert created!" : "")
      );
      setAdjustItem(null);
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setModalLoading(false);
  };

  const handleReorder = async ({ qty }) => {
    setModalLoading(true);
    try {
      const res = await fetch("/api/inventory/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate:    selectedTruck,
          ingredientId:    reorderItem.ingredientId,
          quantityOrdered: qty,
          createdBy:       currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Order placed — PO #${data.poId} for ${fmt(qty)} ${reorderItem.unitOfMeasure}`);
      setReorderItem(null);
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setModalLoading(false);
  };

  const handleOpenExpire = () => {
    const expired = inventory.filter((item) => {
      if (!item.expirationDate || item.quantityOnHand <= 0) return false;
      return new Date(item.expirationDate) < new Date();
    });
    setExpireItems(expired);
  };

  const handleConfirmExpire = async () => {
    setExpireLoading(true);
    try {
      const res = await fetch("/api/inventory/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate: selectedTruck, adjustedBy: currentUser }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const count = data.expired?.length ?? 0;
      showToast(
        count > 0
          ? `Expired ${count} item${count > 1 ? "s" : ""} — quantities set to 0 and logged as waste.`
          : "No expired items found."
      );
      setExpireItems(null);
      setHasShownWarningForTruck(null);
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setExpireLoading(false);
  };



  const filtered = inventory.filter((item) => {
    const matchSearch = !search ||
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      (item.ingredientCategory ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "low"     && item.needsReorder) ||
      (filterStatus === "ok"      && !item.needsReorder) ||
      (filterStatus === "expired" && item.expirationDate && new Date(item.expirationDate) < new Date());
    return matchSearch && matchStatus;
  });

  const activeAlertCount  = alerts.filter((a) => a.alertStatus === "active").length;
  const belowThreshCount  = inventory.filter((i) => i.needsReorder).length;
  const outOfStockCount   = inventory.filter((i) => i.quantityOnHand === 0).length;
  const expiredCount      = inventory.filter((i) => i.expirationDate && new Date(i.expirationDate) < new Date() && i.quantityOnHand > 0).length;
  const selectedTruckName = trucks.find((t) => t.license_plate === selectedTruck)?.truck_name ?? "";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <PackageIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">{selectedTruckName || "Select a truck"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Removed Use by Menu Item and Daily Production buttons */}

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExpire}
              disabled={!selectedTruck}
              className={`gap-2 ${expiredCount > 0 ? "border-destructive text-destructive hover:bg-destructive/10" : ""}`}
            >
              <Trash2Icon className="size-4" />
              Expire Outdated
              {expiredCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">
                  {expiredCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(selectedTruck)}
              disabled={loading}
            >
              <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* Only show truck switcher for admins */}
            {authUser?.role === "admin" && (
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger className="w-56">
                  <TruckIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Select food truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (
                    <SelectItem key={t.license_plate} value={t.license_plate}>
                      {t.truck_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        {/* ── Pending Supply Orders Banner (managers / admins only) ── */}
        <PendingSupplyOrdersBanner
          selectedTruck={selectedTruck}
          onOrderReceived={() => loadData(selectedTruck)}
          showToast={showToast}
        />

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={PackageIcon}       label="Total Ingredients" value={inventory.length} />
          <StatCard icon={XCircleIcon}       label="Out of Stock"      value={outOfStockCount}  variant={outOfStockCount  > 0 ? "danger"  : "success"} />
          <StatCard icon={AlertTriangleIcon} label="Below Threshold"   value={belowThreshCount} variant={belowThreshCount > 0 ? "warning" : "success"} />
          <StatCard icon={BellIcon}          label="Active Alerts"     value={activeAlertCount} variant={activeAlertCount > 0 ? "warning" : "success"} />
        </div>

        {/* ── Banners ───────────────────────────────────────────── */}
        {expiredCount > 0 && (
          <div className="flex gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-red-900 dark:text-red-300">
            <Trash2Icon className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium leading-none mb-1">
                {expiredCount} ingredient{expiredCount > 1 ? "s" : ""} ha{expiredCount === 1 ? "s" : "ve"} expired with stock remaining
              </p>
              <p className="text-sm opacity-80">
                Use the <strong>Expire Outdated</strong> button to zero out and log these as waste.
              </p>
            </div>
          </div>
        )}

        {activeAlertCount > 0 && (
          <div className="flex gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-amber-900 dark:text-amber-300">
            <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium leading-none mb-1">
                {activeAlertCount} ingredient{activeAlertCount > 1 ? "s" : ""} need{activeAlertCount === 1 ? "s" : ""} reordering
              </p>
              <p className="text-sm opacity-80">
                Check the <strong>Reorder Alerts</strong> tab to place orders.
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <Tabs defaultValue="inventory" className="gap-0">
          <TabsList className="w-full justify-start rounded-b-none border border-b-0 bg-muted/50 h-auto p-0">
            <TabsTrigger value="inventory" className="rounded-none rounded-tl-lg data-[state=active]:shadow-none border-r py-3 px-5 gap-2">
              <PackageIcon className="size-4" />
              Inventory
              {belowThreshCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{belowThreshCount}</Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="alerts" className="rounded-none data-[state=active]:shadow-none border-r py-3 px-5 gap-2">
              <BellIcon className="size-4" />
              Reorder Alerts
              {activeAlertCount > 0 && (
                <Badge variant="warning" className="ml-1 text-xs px-1.5 py-0">{activeAlertCount}</Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="history" className="rounded-none rounded-tr-lg data-[state=active]:shadow-none py-3 px-5 gap-2">
              <HistoryIcon className="size-4" />
              Adjustment History
            </TabsTrigger>
          </TabsList>

          {/* ── INVENTORY TAB ──────────────────────────────────── */}
          <TabsContent value="inventory" className="mt-0">
            <Card className="rounded-tl-none">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search ingredients or category…"
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "all",     label: "All" },
                      { key: "low",     label: "⚠ Needs Reorder" },
                      { key: "ok",      label: "✓ Stocked" },
                      { key: "expired", label: "✗ Expired" },
                    ].map((f) => (
                      <Button
                        key={f.key}
                        size="sm"
                        variant={filterStatus === f.key ? "default" : "outline"}
                        onClick={() => setFilterStatus(f.key)}
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <LoadingRows />
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <PackageIcon className="size-10 opacity-30" />
                    <p className="font-medium text-foreground">No ingredients found</p>
                    <p className="text-sm">Try adjusting your search or filter</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Quantity on Hand</TableHead>
                        <TableHead>Reorder Threshold</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item) => {
                        const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
                        return (
                          <TableRow key={item.inventoryId} className={isExpired && item.quantityOnHand > 0 ? "bg-destructive/5" : ""}>
                            <TableCell>
                              <div className="font-semibold">{item.ingredientName}</div>
                              {item.ingredientCategory && (
                                <div className="text-xs text-muted-foreground">{item.ingredientCategory}</div>
                              )}
                            </TableCell>
                            <TableCell><QuantityBar item={item} /></TableCell>
                            <TableCell className="tabular-nums text-sm text-muted-foreground">
                              {fmt(item.reorderThreshold)} {item.unitOfMeasure}
                            </TableCell>
                            <TableCell><StatusBadge item={item} /></TableCell>
                            <TableCell><ExpiryBadge date={item.expirationDate} /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={item.quantityOnHand === 0}
                                  onClick={() => setAdjustItem(item)}
                                >
                                  <MinusCircleIcon className="size-3.5" />
                                  Adjust
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={!item.needsReorder}
                                  onClick={() => setReorderItem(item)}
                                >
                                  <ShoppingCartIcon className="size-3.5" />
                                  Reorder
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ALERTS TAB ─────────────────────────────────────── */}
          <TabsContent value="alerts" className="mt-0">
            <Card className="rounded-tl-none rounded-t-none">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Reorder Alerts</CardTitle>
                <CardDescription>
                  Ingredients below their reorder threshold. Only these may be reordered.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <LoadingRows count={3} />
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <CheckCircle2Icon className="size-10 text-emerald-500 opacity-70" />
                    <p className="font-medium text-foreground">All clear — no active alerts</p>
                    <p className="text-sm">All ingredients are above their reorder thresholds</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Current / Threshold</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Alert Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((a) => {
                        const invItem = inventory.find((i) => i.ingredientId === a.ingredientId);
                        return (
                          <TableRow key={a.alertId}>
                            <TableCell className="font-semibold">{a.ingredientName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 tabular-nums text-sm">
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">{fmt(a.currentActualQty)}</span>
                                <span className="text-muted-foreground">/</span>
                                <span>{fmt(a.reorderThreshold)}</span>
                                <span className="text-muted-foreground">{a.unitOfMeasure}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {a.alertStatus === "active"
                                ? <Badge variant="destructive">Active</Badge>
                                : <Badge variant="warning">Ordered</Badge>
                              }
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(a.alertCreated).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {a.alertStatus === "active" && invItem ? (
                                <Button size="sm" onClick={() => setReorderItem(invItem)}>
                                  <ShoppingCartIcon className="size-3.5" />
                                  Reorder Now
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Order placed</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── HISTORY TAB ────────────────────────────────────── */}
          <TabsContent value="history" className="mt-0">
            <Card className="rounded-tl-none rounded-t-none">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Adjustment History</CardTitle>
                <CardDescription>Last 50 inventory changes for this truck</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <LoadingRows />
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <HistoryIcon className="size-10 opacity-30" />
                    <p className="font-medium text-foreground">No history yet</p>
                    <p className="text-sm">Adjustments will appear here once recorded</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Recorded by</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => {
                        const typeMeta = {
                          waste:             { label: "Waste",      cls: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300" },
                          "order-deduction": { label: "Used",       cls: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300" },
                          restock:           { label: "Restock",    cls: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300" },
                          correction:        { label: "Correction", cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300" },
                        };
                        const meta = typeMeta[h.adjustmentType] ?? { label: h.adjustmentType, cls: "" };
                        return (
                          <TableRow key={h.adjustmentId}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(h.adjustmentDate).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">{h.ingredientName}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
                                {meta.label}
                              </span>
                            </TableCell>
                            <TableCell className={`tabular-nums font-semibold ${h.quantityChange < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {h.quantityChange > 0 ? "+" : ""}{fmt(h.quantityChange)} {h.unitOfMeasure}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {h.reason || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{h.adjustedBy}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────── */}
      {/* Removed UseMenuItemDialog and DailyProductionDialog */}

      <ExpireDialog
        open={expireItems !== null}
        onOpenChange={(o) => { if (!o) setExpireItems(null); }}
        expiredItems={expireItems ?? []}
        onConfirm={handleConfirmExpire}
        loading={expireLoading}
      />

      {/* ── Pending Supply Orders Notice (auto-opens for managers/admins) ── */}
      <Dialog open={pendingOrdersNotice !== null} onOpenChange={(o) => { if (!o) setPendingOrdersNotice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center size-9 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <PackageIcon className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-base">
                {(pendingOrdersNotice ?? []).length} Supply Order{(pendingOrdersNotice ?? []).length !== 1 ? "s" : ""} Awaiting Receipt
              </DialogTitle>
            </div>
            <DialogDescription>
              The following supply orders have been placed and are ready to be received.
              Confirm delivery to restock inventory automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-1">
            {(pendingOrdersNotice ?? []).map((order) => (
              <div
                key={order.poId}
                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">PO-{order.poId}</span>
                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.supplierName} · {order.items.length} ingredient{order.items.length !== 1 ? "s" : ""} · ${fmt(order.totalCost)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400"
                  onClick={() => { setPendingOrdersNotice(null); setPendingActiveOrder(order); }}
                >
                  Receive
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingOrdersNotice(null)}>
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiveOrderDialog
        order={pendingActiveOrder}
        open={!!pendingActiveOrder}
        onOpenChange={(o) => { if (!o) setPendingActiveOrder(null); }}
        onConfirm={handlePendingReceive}
        loading={pendingReceiveLoading}
      />

      <AdjustDialog
        item={adjustItem}
        open={!!adjustItem}
        onOpenChange={(o) => !o && setAdjustItem(null)}
        onConfirm={handleAdjust}
        loading={modalLoading}
      />

      <ReorderDialog
        item={reorderItem}
        open={!!reorderItem}
        onOpenChange={(o) => !o && setReorderItem(null)}
        onConfirm={handleReorder}
        loading={modalLoading}
      />

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-xl border bg-card shadow-xl px-4 py-3.5 max-w-sm text-sm animate-in slide-in-from-bottom-4 ${toast.type === "error" ? "border-destructive/50" : "border-emerald-500/50"}`}>
          {toast.type === "error"
            ? <AlertTriangleIcon className="size-4 text-destructive mt-0.5 shrink-0" />
            : <CheckCircle2Icon  className="size-4 text-emerald-500 mt-0.5 shrink-0" />
          }
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}