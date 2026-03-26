import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  PackageIcon, AlertTriangleIcon, CheckCircle2Icon,
  TruckIcon, MinusCircleIcon, ShoppingCartIcon, HistoryIcon,
  BellIcon, SearchIcon, RefreshCwIcon, XCircleIcon, Trash2Icon,
  ChefHatIcon, PlusIcon, MinusIcon, ClipboardListIcon,
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
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

// ─── Expiry Badge ─────────────────────────────────────────────────────────────
function ExpiryBadge({ date }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  const days = Math.floor((new Date(date) - new Date()) / 86_400_000);
  if (days < 0)  return <Badge variant="destructive">Expired</Badge>;
  if (days <= 3) return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-500">{days}d left</Badge>;
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

// ─── Use Menu Item Dialog (NEW) ───────────────────────────────────────────────
function UseMenuItemDialog({ open, onOpenChange, menuItems, inventory, onConfirm, loading }) {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [recipe, setRecipe] = useState([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [shortages, setShortages] = useState([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedMenuItemId("");
      setQuantity(1);
      setRecipe([]);
      setShortages([]);
    }
  }, [open]);

  // Load recipe preview when menu item changes
  useEffect(() => {
    if (!selectedMenuItemId) {
      setRecipe([]);
      setShortages([]);
      return;
    }
    setRecipeLoading(true);
    fetch(`/api/recipes`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = Array.isArray(data)
          ? data.filter((r) => String(r.menu_item_id) === String(selectedMenuItemId))
          : [];
        setRecipe(filtered);
        setRecipeLoading(false);
      })
      .catch(() => setRecipeLoading(false));
  }, [selectedMenuItemId]);

  // Check for shortages whenever recipe, quantity, or inventory changes
  useEffect(() => {
    if (!recipe.length) { setShortages([]); return; }
    const problems = [];
    for (const r of recipe) {
      const needed = parseFloat(r.quantity_needed) * quantity;
      const invItem = inventory.find((i) => i.ingredientId === r.ingredient_id);
      const available = invItem ? invItem.quantityOnHand : 0;
      if (available < needed) {
        problems.push({
          ingredient: r.ingredient_name,
          unit: r.unit_of_measure,
          needed,
          available,
        });
      }
    }
    setShortages(problems);
  }, [recipe, quantity, inventory]);

  const selectedItem = menuItems.find((m) => String(m.menu_item_id) === String(selectedMenuItemId));
  const canSubmit = selectedMenuItemId && recipe.length > 0 && shortages.length === 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHatIcon className="size-5" />
            Use Ingredients by Menu Item
          </DialogTitle>
          <DialogDescription>
            Select the menu item being prepared. Ingredients will be deducted
            automatically based on the recipe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Menu Item Selector */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Menu Item</label>
            <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a menu item…" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((m) => (
                  <SelectItem key={m.menu_item_id} value={String(m.menu_item_id)}>
                    {m.item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          {selectedMenuItemId && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Quantity to Prepare</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <MinusIcon className="size-3.5" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <PlusIcon className="size-3.5" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {quantity === 1 ? "portion" : "portions"}
                </span>
              </div>
            </div>
          )}

          {/* Recipe Preview */}
          {selectedMenuItemId && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                Ingredients that will be deducted
              </label>
              {recipeLoading ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              ) : recipe.length === 0 ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  No recipe found for this menu item. Add ingredients to the recipe first.
                </div>
              ) : (
                <div className="rounded-lg border divide-y overflow-hidden">
                  {recipe.map((r) => {
                    const needed = parseFloat(r.quantity_needed) * quantity;
                    const invItem = inventory.find((i) => i.ingredientId === r.ingredient_id);
                    const available = invItem ? invItem.quantityOnHand : 0;
                    const insufficient = available < needed;
                    return (
                      <div
                        key={r.recipe_id}
                        className={`flex items-center justify-between px-3 py-2.5 text-sm ${insufficient ? "bg-destructive/5" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {insufficient ? (
                            <AlertTriangleIcon className="size-3.5 text-destructive shrink-0" />
                          ) : (
                            <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span className={insufficient ? "text-destructive font-medium" : ""}>
                            {r.ingredient_name}
                          </span>
                        </div>
                        <div className="tabular-nums text-right">
                          <span className={`font-semibold ${insufficient ? "text-destructive" : ""}`}>
                            −{fmt(needed)}
                          </span>
                          <span className="text-muted-foreground"> {r.unit_of_measure}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({fmt(available)} avail.)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Shortage Warning */}
          {shortages.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-destructive">
                Insufficient stock for {quantity} portion{quantity > 1 ? "s" : ""}:
              </p>
              {shortages.map((s) => (
                <p key={s.ingredient} className="text-xs text-destructive">
                  • {s.ingredient}: need {fmt(s.needed)} {s.unit}, have {fmt(s.available)}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!canSubmit || loading}
            onClick={() =>
              onConfirm({
                menuItemId: selectedMenuItemId,
                menuItemName: selectedItem?.item_name,
                quantity,
              })
            }
          >
            {loading ? "Deducting…" : `Deduct for ${quantity} portion${quantity > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Daily Production Log Dialog (NEW) ────────────────────────────────────────
function DailyProductionDialog({ open, onOpenChange, menuItems, inventory, onConfirm, loading, selectedTruck }) {
  const [productions, setProductions] = useState({}); // { menuItemId: quantity }
  const [recipesData, setRecipesData] = useState({}); // { menuItemId: [recipe] }
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [aggregatedIngredients, setAggregatedIngredients] = useState({}); // { ingredientId: { name, unit, total, available } }
  const [shortages, setShortages] = useState([]);
  const [todaysSales, setTodaysSales] = useState({}); // { menuItemId: quantity }

  // Reset and load today's sales when dialog opens
  useEffect(() => {
    if (open && selectedTruck) {
      setProductions({});
      setRecipesData({});
      setAggregatedIngredients({});
      setShortages([]);
      setTodaysSales({});
      
      // Load all recipes and today's sales in parallel
      setRecipesLoading(true);
      Promise.all([
        fetch(`/api/recipes`).then((r) => r.json()),
        fetch(`/api/inventory/today-sales?licensePlate=${encodeURIComponent(selectedTruck)}`).then((r) => r.json()),
      ])
        .then(([recipes, sales]) => {
          // Process recipes into map
          const byMenuItem = {};
          if (Array.isArray(recipes)) {
            recipes.forEach((r) => {
              const mid = String(r.menu_item_id);
              if (!byMenuItem[mid]) byMenuItem[mid] = [];
              byMenuItem[mid].push(r);
            });
          }
          setRecipesData(byMenuItem);

          // Process today's sales into map and pre-populate productions
          const salesMap = {};
          const productsMap = {};
          if (Array.isArray(sales)) {
            sales.forEach((s) => {
              const mid = String(s.menuItemId);
              salesMap[mid] = s.totalQuantity;
              productsMap[mid] = s.totalQuantity;
            });
          }
          setTodaysSales(salesMap);
          setProductions(productsMap); // Pre-populate with today's sales
          setRecipesLoading(false);
        })
        .catch(() => setRecipesLoading(false));
    }
  }, [open, selectedTruck]);

  // Recalculate aggregated ingredients and check for shortages
  useEffect(() => {
    const aggregated = {};
    const hasShortage = [];

    Object.entries(productions).forEach(([menuItemId, qty]) => {
      if (qty <= 0) return;
      const recipe = recipesData[String(menuItemId)] || [];
      recipe.forEach((r) => {
        const needed = parseFloat(r.quantity_needed) * qty;
        const ingId = r.ingredient_id;
        if (!aggregated[ingId]) {
          aggregated[ingId] = {
            name: r.ingredient_name,
            unit: r.unit_of_measure,
            total: 0,
            available: 0,
          };
        }
        aggregated[ingId].total += needed;
      });
    });

    // Find inventory levels
    Object.entries(aggregated).forEach(([ingId, ing]) => {
      const invItem = inventory.find((i) => i.ingredientId === parseInt(ingId));
      if (invItem) {
        ing.available = invItem.quantityOnHand;
        if (invItem.quantityOnHand < ing.total) {
          hasShortage.push({
            ingredient: ing.name,
            unit: ing.unit,
            needed: ing.total,
            available: invItem.quantityOnHand,
          });
        }
      } else {
        ing.available = 0;
        hasShortage.push({
          ingredient: ing.name,
          unit: ing.unit,
          needed: ing.total,
          available: 0,
        });
      }
    });

    setAggregatedIngredients(aggregated);
    setShortages(hasShortage);
  }, [productions, recipesData, inventory]);

  const totalItems = Object.values(productions).reduce((sum, qty) => sum + qty, 0);
  const canSubmit = totalItems > 0 && shortages.length === 0 && !loading;

  const handleQtyChange = (menuItemId, newQty) => {
    const qty = Math.max(0, parseInt(newQty) || 0);
    if (qty === 0) {
      const newProds = { ...productions };
      delete newProds[menuItemId];
      setProductions(newProds);
    } else {
      setProductions({ ...productions, [menuItemId]: qty });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardListIcon className="size-5" />
            Daily Production Log
          </DialogTitle>
          <DialogDescription>
            Log how many of each menu item were prepared today. Inventory will be
            deducted based on recipes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Menu Items Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">Menu Items Prepared</h3>
            {recipesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                {menuItems.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No menu items available</div>
                ) : (
                  menuItems.map((item) => {
                    const hasRecipe = recipesData[String(item.menu_item_id)]?.length > 0;
                    const qty = productions[String(item.menu_item_id)] || 0;
                    const salesQty = todaysSales[String(item.menu_item_id)];
                    const hasSalesData = salesQty !== undefined && salesQty > 0;
                    return (
                      <div
                        key={item.menu_item_id}
                        className="flex items-center justify-between px-3 py-3 text-sm gap-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          {!hasRecipe && (
                            <p className="text-xs text-orange-600">No recipe configured</p>
                          )}
                          {hasSalesData && (
                            <p className="text-xs text-emerald-600 font-medium">
                              Today's sales: {salesQty} {salesQty === 1 ? "item" : "items"}
                            </p>
                          )}
                        </div>
                        {hasRecipe && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-7 shrink-0"
                              onClick={() => handleQtyChange(item.menu_item_id, qty - 1)}
                              disabled={qty <= 0}
                            >
                              <MinusIcon className="size-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => handleQtyChange(item.menu_item_id, e.target.value)}
                              className="w-16 text-center text-sm h-8"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-7 shrink-0"
                              onClick={() => handleQtyChange(item.menu_item_id, qty + 1)}
                            >
                              <PlusIcon className="size-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {totalItems > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-semibold">
                Total items prepared: <span className="text-lg">{totalItems}</span>
              </p>
            </div>
          )}

          {/* Aggregated Ingredients Preview */}
          {Object.keys(aggregatedIngredients).length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold">Ingredients to Deduct</h3>
              <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                {Object.entries(aggregatedIngredients).map(([ingId, ing]) => {
                  const insufficient = ing.available < ing.total;
                  return (
                    <div
                      key={ingId}
                      className={`flex items-center justify-between px-3 py-2.5 text-sm ${insufficient ? "bg-destructive/5" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {insufficient ? (
                          <AlertTriangleIcon className="size-3.5 text-destructive shrink-0" />
                        ) : (
                          <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className={insufficient ? "text-destructive font-medium" : ""}>
                          {ing.name}
                        </span>
                      </div>
                      <div className="tabular-nums text-right">
                        <span className={`font-semibold ${insufficient ? "text-destructive" : ""}`}>
                          −{fmt(ing.total)}
                        </span>
                        <span className="text-muted-foreground"> {ing.unit}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({fmt(ing.available)} avail.)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shortage Warning */}
          {shortages.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-destructive">⚠ Insufficient stock:</p>
              {shortages.map((s) => (
                <p key={s.ingredient} className="text-xs text-destructive">
                  • {s.ingredient}: need {fmt(s.needed)} {s.unit}, have {fmt(s.available)}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={() => onConfirm(productions)}>
            {loading ? "Deducting…" : `Deduct for ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Expire Confirmation Dialog (NEW) ─────────────────────────────────────────
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

// ─── Manual Adjust Dialog (existing, kept for individual ingredient tweaks) ───
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
              { label: "Current stock",       val: `${fmt(item?.quantityOnHand)} ${item?.unitOfMeasure}`,   cls: "text-orange-600" },
              { label: "Reorder threshold",   val: `${fmt(item?.reorderThreshold)} ${item?.unitOfMeasure}` },
              { label: "Suggested order qty", val: `${suggested} ${item?.unitOfMeasure}`,                   cls: "text-blue-600" },
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
  const [useMenuItemOpen,         setUseMenuItemOpen]         = useState(false);
  const [dailyProductionOpen,     setDailyProductionOpen]     = useState(false);
  const [expireItems,             setExpireItems]             = useState(null); // null = not open, [] = open
  const [hasShownWarningForTruck, setHasShownWarningForTruck] = useState(null);
  const [modalLoading,            setModalLoading]            = useState(false);
  const [expireLoading,           setExpireLoading]           = useState(false);
  const [productionLoading,       setProductionLoading]       = useState(false);

  const { toast, show: showToast } = useToast();

  // Load trucks + menu items on mount
  useEffect(() => {
    fetch("/api/trucks")
      .then((r) => r.json())
      .then((data) => {
        setTrucks(data);
        if (data.length > 0) setSelectedTruck(data[0].license_plate);
      })
      .catch(() => showToast("Failed to load trucks", "error"));

    fetch("/api/menu-items")
      .then((r) => r.json())
      .then((data) => setMenuItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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

  // ── Auto-detect expired items and show warning dialog ─────────────────────
  useEffect(() => {
    if (inventory.length === 0 || loading) return;
    
    const expiredItems = inventory.filter((item) => {
      if (!item.expirationDate || item.quantityOnHand <= 0) return false;
      return new Date(item.expirationDate) < new Date();
    });

    // Automatically open the dialog only if:
    // 1. Expired items exist
    // 2. Dialog is not already open (expireItems is null)
    // 3. We haven't already shown the warning for this truck (to avoid re-opening when user closes it)
    if (expiredItems.length > 0 && expireItems === null && hasShownWarningForTruck !== selectedTruck) {
      setExpireItems(expiredItems);
      setHasShownWarningForTruck(selectedTruck);
    }
  }, [inventory, loading, selectedTruck, expireItems, hasShownWarningForTruck]);

  // ── Handle "Use Menu Item" ────────────────────────────────────────────────
  const handleUseMenuItem = async ({ menuItemId, menuItemName, quantity }) => {
    setModalLoading(true);
    try {
      const res = await fetch("/api/inventory/use-menu-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate: selectedTruck,
          menuItemId,
          menuItemName,
          quantity,
          adjustedBy: currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.success) {
        showToast("Insufficient stock for some ingredients.", "error");
        return;
      }
      const alertMsg = data.alertsCreated?.length
        ? ` Reorder alerts created for: ${data.alertsCreated.join(", ")}.`
        : "";
      showToast(
        `✓ Deducted ingredients for ${quantity}x ${menuItemName || "item"}.${alertMsg}`
      );
      setUseMenuItemOpen(false);
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setModalLoading(false);
  };

  // ── Handle manual adjust ─────────────────────────────────────────────────
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

  // ── Handle reorder ───────────────────────────────────────────────────────
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

  // ── Handle "Check & Expire" ───────────────────────────────────────────────
  const handleOpenExpire = () => {
    // Show expired items from current inventory state immediately
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
        body: JSON.stringify({
          licensePlate: selectedTruck,
          adjustedBy: currentUser,
        }),
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
      // Reset the flag so the warning shows again if expired items appear in the future
      setHasShownWarningForTruck(null);
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setExpireLoading(false);
  };

  // ── Handle Daily Production ──────────────────────────────────────────────
  const handleDailyProduction = async (productions) => {
    // productions is { menuItemId: quantity }
    const productionArray = Object.entries(productions).map(([menuItemId, qty]) => ({
      menuItemId: parseInt(menuItemId),
      quantity: qty,
    }));

    setProductionLoading(true);
    try {
      const res = await fetch("/api/inventory/use-daily-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate: selectedTruck,
          productions: productionArray,
          adjustedBy: currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.success) {
        showToast("Operation failed. Please try again.", "error");
        return;
      }
      
      const totalItems = productionArray.reduce((sum, p) => sum + p.quantity, 0);
      const alertMsg = data.alertsCreated?.length
        ? ` Reorder alerts created for: ${data.alertsCreated.join(", ")}.`
        : "";
      showToast(
        `✓ Deducted ingredients for ${totalItems} item${totalItems === 1 ? "" : "s"} prepared.${alertMsg}`
      );
      setDailyProductionOpen(false);
      loadData(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setProductionLoading(false);
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
            {/* ── NEW: Use by Menu Item ── */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setUseMenuItemOpen(true)}
              disabled={!selectedTruck}
              className="gap-2"
            >
              <ChefHatIcon className="size-4" />
              Use by Menu Item
            </Button>

            {/* ── NEW: Daily Production Log ── */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setDailyProductionOpen(true)}
              disabled={!selectedTruck}
              className="gap-2"
            >
              <ClipboardListIcon className="size-4" />
              Daily Production
            </Button>

            {/* ── NEW: Expire Outdated ── */}
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

        {/* ── Banners ───────────────────────────────────────────── */}
        {expiredCount > 0 && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300">
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
                                  title="Manual deduction (waste, correction, etc.)"
                                >
                                  <MinusCircleIcon className="size-3.5" />
                                  Adjust
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
                                <span className="text-orange-600 font-semibold">{fmt(a.currentActualQty)}</span>
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
                          waste:             { label: "Waste",      cls: "bg-red-100 text-red-800" },
                          "order-deduction": { label: "Used",       cls: "bg-indigo-100 text-indigo-800" },
                          restock:           { label: "Restock",    cls: "bg-emerald-100 text-emerald-800" },
                          correction:        { label: "Correction", cls: "bg-amber-100 text-amber-800" },
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
                            <TableCell className={`tabular-nums font-semibold ${h.quantityChange < 0 ? "text-destructive" : "text-emerald-600"}`}>
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
      <UseMenuItemDialog
        open={useMenuItemOpen}
        onOpenChange={setUseMenuItemOpen}
        menuItems={menuItems}
        inventory={inventory}
        onConfirm={handleUseMenuItem}
        loading={modalLoading}
      />

      <DailyProductionDialog
        open={dailyProductionOpen}
        onOpenChange={setDailyProductionOpen}
        menuItems={menuItems}
        inventory={inventory}
        onConfirm={handleDailyProduction}
        loading={productionLoading}
        selectedTruck={selectedTruck}
      />

      <ExpireDialog
        open={expireItems !== null}
        onOpenChange={(o) => { if (!o) setExpireItems(null); }}
        expiredItems={expireItems ?? []}
        onConfirm={handleConfirmExpire}
        loading={expireLoading}
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