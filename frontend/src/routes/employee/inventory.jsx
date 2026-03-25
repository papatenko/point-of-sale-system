import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";

export const Route = createFileRoute("/employee/inventory")({
  component: InventoryPage,
});

const fmt = (n) => (n == null ? "—" : parseFloat(n).toFixed(2));

function StatusBadge({ item }) {
  if (item.quantityOnHand === 0)
    return <Badge variant="destructive">Out of Stock</Badge>;
  if (item.needsReorder)
    return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-500">Below Threshold</Badge>;

  const ratio = item.reorderThreshold > 0 ? item.quantityOnHand / item.reorderThreshold : 2;
  if (ratio < 1.5)
    return <Badge variant="warning">Running Low</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}

function ExpiryBadge({ date }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  const days = Math.floor((new Date(date) - new Date()) / 86_400_000);
  if (days < 0)  return <Badge variant="destructive">Expired</Badge>;
  if (days <= 3) return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-500">{days}d left</Badge>;
  if (days <= 7) return <Badge variant="warning">{days}d left</Badge>;
  return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span>;
}

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
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant = "default" }) {
  const colorMap = {
    default: "text-foreground",
    danger:  "text-destructive",
    warning: "text-amber-500",
    success: "text-emerald-500",
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

function AdjustDialog({ item, open, onOpenChange, onConfirm, loading }) {
  const [qty, setQty] = useState("");
  const [type, setType] = useState("order-deduction");
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

function InventoryPage() {
  const {
    trucks,
    selectedTruck,
    setSelectedTruck,
    inventory,
    alerts,
    history,
    loading,
    modalLoading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    toast,
    adjustInventory,
    placeReorder,
    refresh,
    stats,
  } = useInventory();

  const [adjustItem, setAdjustItem] = useState(null);
  const [reorderItem, setReorderItem] = useState(null);

  const handleAdjustConfirm = (data) => {
    if (!adjustItem) return;
    adjustInventory(adjustItem.ingredientId, adjustItem.unitOfMeasure, data);
    setAdjustItem(null);
  };

  const handleReorderConfirm = (data) => {
    if (!reorderItem) return;
    placeReorder(reorderItem.ingredientId, reorderItem.unitOfMeasure, data);
    setReorderItem(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <PackageIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">{stats.selectedTruckName || "Select a truck"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={PackageIcon}       label="Total Ingredients" value={stats.totalIngredients} />
          <StatCard icon={XCircleIcon}       label="Out of Stock"      value={stats.outOfStockCount}  variant={stats.outOfStockCount  > 0 ? "danger"  : "success"} />
          <StatCard icon={AlertTriangleIcon} label="Below Threshold"   value={stats.belowThreshCount} variant={stats.belowThreshCount > 0 ? "warning" : "success"} />
          <StatCard icon={BellIcon}          label="Active Alerts"     value={stats.activeAlertCount} variant={stats.activeAlertCount > 0 ? "warning" : "success"} />
        </div>

        {stats.activeAlertCount > 0 && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium leading-none mb-1">
                {stats.activeAlertCount} ingredient{stats.activeAlertCount > 1 ? "s" : ""} need{stats.activeAlertCount === 1 ? "s" : ""} reordering
              </p>
              <p className="text-sm opacity-80">
                Check the <strong>Reorder Alerts</strong> tab to place orders for low-stock ingredients.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="inventory" className="gap-0">
          <TabsList className="w-full justify-start rounded-b-none border border-b-0 bg-muted/50 h-auto p-0">
            <TabsTrigger value="inventory" className="rounded-none rounded-tl-lg data-[state=active]:shadow-none border-r py-3 px-5 gap-2">
              <PackageIcon className="size-4" />
              Inventory
              {stats.belowThreshCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{stats.belowThreshCount}</Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="alerts" className="rounded-none data-[state=active]:shadow-none border-r py-3 px-5 gap-2">
              <BellIcon className="size-4" />
              Reorder Alerts
              {stats.activeAlertCount > 0 && (
                <Badge variant="warning" className="ml-1 text-xs px-1.5 py-0">{stats.activeAlertCount}</Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="history" className="rounded-none rounded-tr-lg data-[state=active]:shadow-none py-3 px-5 gap-2">
              <HistoryIcon className="size-4" />
              Adjustment History
            </TabsTrigger>
          </TabsList>

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
                ) : inventory.length === 0 ? (
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
                      {inventory.map((item) => (
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
                                    : `Reorder only available when below threshold (${fmt(item.reorderThreshold)} ${item.unitOfMeasure})`
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

          <TabsContent value="alerts" className="mt-0">
            <Card className="rounded-tl-none rounded-t-none">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Reorder Alerts</CardTitle>
                <CardDescription>
                  Ingredients that have fallen below their reorder threshold. Only these may be reordered.
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

          <TabsContent value="history" className="mt-0">
            <Card className="rounded-tl-none rounded-t-none">
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

      <AdjustDialog
        item={adjustItem}
        open={!!adjustItem}
        onOpenChange={(o) => !o && setAdjustItem(null)}
        onConfirm={handleAdjustConfirm}
        loading={modalLoading}
      />
      <ReorderDialog
        item={reorderItem}
        open={!!reorderItem}
        onOpenChange={(o) => !o && setReorderItem(null)}
        onConfirm={handleReorderConfirm}
        loading={modalLoading}
      />

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
