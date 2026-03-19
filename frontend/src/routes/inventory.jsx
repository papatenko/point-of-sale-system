import { useState, useEffect, useCallback } from "react";
import {
  PackageIcon, AlertTriangleIcon, CheckCircle2Icon,
  TruckIcon, MinusCircleIcon, ShoppingCartIcon, HistoryIcon,
  BellIcon, SearchIcon, RefreshCwIcon, XCircleIcon,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { fmt, useToast } from "@/utils/format";

// ─── Badge className constants ────────────────────────────────────────────────
// The installed Badge only has: default, secondary, destructive, outline,
// ghost, link. We compose warning / success on top of "outline" via className.
const BADGE_WARNING = "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
const BADGE_SUCCESS = "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ item }) {
  if (item.quantityOnHand === 0)
    return <Badge variant="destructive">Out of Stock</Badge>;
  if (item.needsReorder)
    return <Badge variant="destructive" className="bg-orange-500 dark:bg-orange-600">Below Threshold</Badge>;

  const ratio = item.reorderThreshold > 0 ? item.quantityOnHand / item.reorderThreshold : 2;
  if (ratio < 1.5)
    return <Badge variant="outline" className={BADGE_WARNING}>Running Low</Badge>;
  return <Badge variant="outline" className={BADGE_SUCCESS}>In Stock</Badge>;
}

// ─── Expiry Badge ─────────────────────────────────────────────────────────────
function ExpiryBadge({ date }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  const days = Math.floor((new Date(date) - new Date()) / 86_400_000);
  if (days < 0)  return <Badge variant="destructive">Expired</Badge>;
  if (days <= 3) return <Badge variant="destructive" className="bg-orange-500 dark:bg-orange-600">{days}d left</Badge>;
  if (days <= 7) return <Badge variant="outline" className={BADGE_WARNING}>{days}d left</Badge>;
  return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span>;
}

// ─── Quantity Bar ─────────────────────────────────────────────────────────────
function QuantityBar({ item }) {
  const ratio = item.reorderThreshold > 0
    ? Math.min(item.quantityOnHand / (item.reorderThreshold * 2), 1)
    : 1;
  const fillColor =
    item.quantityOnHand === 0 ? "bg-destructive"
    : item.needsReorder       ? "bg-orange-500"
    : ratio < 0.75            ? "bg-yellow-500"
    : "bg-emerald-500";

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
// "variant" here is an internal prop — unrelated to Badge or any shadcn variant.
function StatCard({ icon: Icon, label, value, variant = "default" }) {
  const color = {
    default: "text-foreground",
    danger:  "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
  }[variant] ?? "text-foreground";

  return (
    <Card>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${color}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading rows ─────────────────────────────────────────────────────────────
function LoadingRows({ count = 5 }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 w-full rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// ─── Adjust Dialog ────────────────────────────────────────────────────────────
function AdjustDialog({ item, open, onOpenChange, onConfirm, loading }) {
  const [qty,    setQty]    = useState("");
  const [type,   setType]   = useState("order-deduction");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) { setQty(""); setType("order-deduction"); setReason(""); }
  }, [open]);

  const invalid = !qty || parseFloat(qty) <= 0 || parseFloat(qty) > (item?.quantityOnHand ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deduct Inventory</DialogTitle>
          <DialogDescription>
            {item?.ingredientName} — currently{" "}
            <strong>{fmt(item?.quantityOnHand)} {item?.unitOfMeasure}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Adjustment type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
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
              Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              placeholder="e.g. prepared 12 shawarma wraps"
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
  const suggested = item
    ? Math.max(item.reorderThreshold * 3 - item.quantityOnHand, item.reorderThreshold).toFixed(2)
    : "0";
  const [qty, setQty] = useState(suggested);

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

// ─── Page ─────────────────────────────────────────────────────────────────────
export function InventoryPage() {
  const currentUser = "manager@example.com";

  const [trucks,        setTrucks]        = useState([]);
  const [selectedTruck, setSelectedTruck] = useState("");
  const [inventory,     setInventory]     = useState([]);
  const [alerts,        setAlerts]        = useState([]);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [adjustItem,    setAdjustItem]    = useState(null);
  const [reorderItem,   setReorderItem]   = useState(null);
  const [modalLoading,  setModalLoading]  = useState(false);

  const { toast, show: showToast } = useToast();

  useEffect(() => {
    fetch("/api/trucks")
      .then((r) => r.json())
      .then((data) => { setTrucks(data); if (data.length > 0) setSelectedTruck(data[0].license_plate); })
      .catch(() => showToast("Failed to load trucks", "error"));
  }, []);

  const loadData = useCallback(async (lp) => {
    if (!lp) return;
    setLoading(true);
    try {
      const [inv, alt, hist] = await Promise.all([
        fetch(`/api/inventory?licensePlate=${encodeURIComponent(lp)}`).then((r) => r.json()),
        fetch(`/api/inventory/alerts?licensePlate=${encodeURIComponent(lp)}`).then((r) => r.json()),
        fetch(`/api/inventory/history?licensePlate=${encodeURIComponent(lp)}&limit=40`).then((r) => r.json()),
      ]);
      setInventory(Array.isArray(inv)  ? inv  : []);
      setAlerts   (Array.isArray(alt)  ? alt  : []);
      setHistory  (Array.isArray(hist) ? hist : []);
    } catch { showToast("Failed to load inventory", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(selectedTruck); }, [selectedTruck, loadData]);

  const handleAdjust = async ({ qty, type, reason }) => {
    setModalLoading(true);
    try {
      const res  = await fetch("/api/inventory/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate: selectedTruck, ingredientId: adjustItem.ingredientId, quantityUsed: qty, adjustmentType: type, reason, adjustedBy: currentUser }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Updated. New qty: ${fmt(data.newQuantity)} ${adjustItem.unitOfMeasure}` + (data.alertCreated ? " — Reorder alert created!" : ""));
      setAdjustItem(null);
      loadData(selectedTruck);
    } catch (err) { showToast(err.message, "error"); }
    setModalLoading(false);
  };

  const handleReorder = async ({ qty }) => {
    setModalLoading(true);
    try {
      const res  = await fetch("/api/inventory/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate: selectedTruck, ingredientId: reorderItem.ingredientId, quantityOrdered: qty, createdBy: currentUser }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Order placed — PO #${data.poId} for ${fmt(qty)} ${reorderItem.unitOfMeasure}`);
      setReorderItem(null);
      loadData(selectedTruck);
    } catch (err) { showToast(err.message, "error"); }
    setModalLoading(false);
  };

  const filtered = inventory.filter((item) => {
    const matchSearch = !search ||
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      (item.ingredientCategory ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "low" && item.needsReorder) ||
      (filterStatus === "ok"  && !item.needsReorder);
    return matchSearch && matchStatus;
  });

  const activeAlertCount  = alerts.filter((a) => a.alertStatus === "active").length;
  const belowThreshCount  = inventory.filter((i) => i.needsReorder).length;
  const outOfStockCount   = inventory.filter((i) => i.quantityOnHand === 0).length;
  const selectedTruckName = trucks.find((t) => t.license_plate === selectedTruck)?.truck_name ?? "";

  // ── Shared TabsTrigger className ─────────────────────────────────────────────
  // The uploaded TabsTrigger has `flex-1` by default which stretches each tab to
  // fill equal space. `flex-none` overrides that so tabs are content-width.
  // `rounded-none` removes the default rounded-md. `h-auto` overrides the
  // h-[calc(100%-1px)] so height comes from our py-3 padding instead.
  const triggerCls = "flex-none rounded-none h-auto py-3 px-5 gap-2 data-[state=active]:shadow-none";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────── */}
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

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => loadData(selectedTruck)} disabled={loading}>
              <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {/* SelectTrigger defaults to w-fit in the uploaded file; w-56 overrides it */}
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* ── Stat Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={PackageIcon}       label="Total Ingredients" value={inventory.length} />
          <StatCard icon={XCircleIcon}       label="Out of Stock"      value={outOfStockCount}  variant={outOfStockCount  > 0 ? "danger"  : "success"} />
          <StatCard icon={AlertTriangleIcon} label="Below Threshold"   value={belowThreshCount} variant={belowThreshCount > 0 ? "warning" : "success"} />
          <StatCard icon={BellIcon}          label="Active Alerts"     value={activeAlertCount} variant={activeAlertCount > 0 ? "warning" : "success"} />
        </div>

        {/* ── Alert banner ──────────────────────────────────────── */}
        {activeAlertCount > 0 && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
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
        {/*
          TabsList uses variant="line" from the uploaded tabs.jsx.
          "line" gives: `gap-1 bg-transparent` as the base — no rounded pill
          background — which is the right foundation for a border-tab design.
          We add `border-b w-full justify-start` on top of that.

          We do NOT use variant="default" here because the uploaded version's
          default gives a `bg-muted rounded-lg p-[3px]` pill container, and the
          triggers get `h-[calc(100%-1px)]` which collapses when the parent
          has no fixed height — causing zero-height tabs.
        */}
        <Tabs defaultValue="inventory">
          <TabsList
            variant="line"
            className="w-full justify-start border-b rounded-none gap-0 pb-0"
          >
            <TabsTrigger value="inventory" className={`${triggerCls} border-b-2 border-transparent data-[state=active]:border-primary`}>
              <PackageIcon className="size-4" />
              Inventory
              {belowThreshCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">
                  {belowThreshCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="alerts" className={`${triggerCls} border-b-2 border-transparent data-[state=active]:border-primary`}>
              <BellIcon className="size-4" />
              Reorder Alerts
              {activeAlertCount > 0 && (
                // "warning" variant doesn't exist — use outline + amber className
                <Badge variant="outline" className={`ml-1 h-4 px-1.5 text-[10px] ${BADGE_WARNING}`}>
                  {activeAlertCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="history" className={`${triggerCls} border-b-2 border-transparent data-[state=active]:border-primary`}>
              <HistoryIcon className="size-4" />
              Adjustment History
            </TabsTrigger>
          </TabsList>

          {/* ── Inventory tab ──────────────────────────────────── */}
          <TabsContent value="inventory">
            <Card className="rounded-t-none border-t-0">
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
                  <div className="flex gap-2">
                    {[
                      { key: "all", label: "All" },
                      { key: "low", label: "⚠ Needs Reorder" },
                      { key: "ok",  label: "✓ Stocked" },
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
                      {filtered.map((item) => (
                        <TableRow key={item.inventoryId}>
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
                                Use
                              </Button>
                              <Button
                                size="sm"
                                disabled={!item.needsReorder}
                                onClick={() => setReorderItem(item)}
                                title={
                                  item.needsReorder
                                    ? "Place a reorder"
                                    : `Reorder only when below threshold (${fmt(item.reorderThreshold)} ${item.unitOfMeasure})`
                                }
                              >
                                <ShoppingCartIcon className="size-3.5" />
                                Reorder
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Alerts tab ─────────────────────────────────────── */}
          <TabsContent value="alerts">
            <Card className="rounded-t-none border-t-0">
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
                                // "warning" variant doesn't exist — use outline + amber className
                                : <Badge variant="outline" className={BADGE_WARNING}>Ordered</Badge>
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
                                <Badge variant="outline" className="text-muted-foreground">
                                  Order placed
                                </Badge>
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

          {/* ── History tab ────────────────────────────────────── */}
          <TabsContent value="history">
            <Card className="rounded-t-none border-t-0">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Adjustment History</CardTitle>
                <CardDescription>Last 40 inventory changes for this truck</CardDescription>
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
                          waste:             { label: "Waste",      cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
                          "order-deduction": { label: "Used",       cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
                          restock:           { label: "Restock",    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
                          correction:        { label: "Correction", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
                        };
                        const meta = typeMeta[h.adjustmentType] ?? { label: h.adjustmentType, cls: "" };

                        return (
                          <TableRow key={h.adjustmentId}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(h.adjustmentDate).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">{h.ingredientName}</TableCell>
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