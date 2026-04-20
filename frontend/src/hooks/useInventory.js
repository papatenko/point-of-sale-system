import { useState, useEffect, useCallback } from "react";

const fmt = (n) => (n == null ? "—" : parseFloat(n).toFixed(2));

export function useInventory(currentUser = "manager@example.com") {
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState("");
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchTrucks = useCallback(async () => {
    try {
      const res = await fetch("/api/trucks?status=active");
      const data = await res.json();
      setTrucks(data);
      if (data.length > 0 && !selectedTruck) {
        setSelectedTruck(data[0].license_plate);
      }
    } catch {
      showToast("Failed to load trucks", "error");
    }
  }, [selectedTruck, showToast]);

  const loadInventory = useCallback(async (lp) => {
    if (!lp) return;
    setLoading(true);
    try {
      const [inv, alt, hist] = await Promise.all([
        fetch(`/api/inventory?licensePlate=${encodeURIComponent(lp)}`).then((r) => r.json()),
        fetch(`/api/inventory/alerts?licensePlate=${encodeURIComponent(lp)}`).then((r) => r.json()),
        fetch(`/api/inventory/history?licensePlate=${encodeURIComponent(lp)}&limit=40`).then((r) => r.json()),
      ]);
      setInventory(Array.isArray(inv) ? inv : []);
      setAlerts(Array.isArray(alt) ? alt : []);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch {
      showToast("Failed to load inventory", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  useEffect(() => {
    if (selectedTruck) {
      loadInventory(selectedTruck);
    }
  }, [selectedTruck, loadInventory]);

  const adjustInventory = useCallback(async (ingredientId, unitOfMeasure, { qty, type, reason }) => {
    setModalLoading(true);
    try {
      const res = await fetch("/api/inventory/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate: selectedTruck,
          ingredientId,
          quantityUsed: qty,
          adjustmentType: type,
          reason,
          adjustedBy: currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(
        `Updated. New qty: ${fmt(data.newQuantity)} ${unitOfMeasure}` +
        (data.alertCreated ? " — Reorder alert created!" : "")
      );
      loadInventory(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setModalLoading(false);
  }, [selectedTruck, currentUser, loadInventory, showToast]);

  const placeReorder = useCallback(async (ingredientId, unitOfMeasure, { qty }) => {
    setModalLoading(true);
    try {
      const res = await fetch("/api/inventory/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate: selectedTruck,
          ingredientId,
          quantityOrdered: qty,
          createdBy: currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Order placed — PO #${data.poId} for ${fmt(qty)} ${unitOfMeasure}`);
      loadInventory(selectedTruck);
    } catch (err) {
      showToast(err.message, "error");
    }
    setModalLoading(false);
  }, [selectedTruck, currentUser, loadInventory, showToast]);

  const refresh = useCallback(() => {
    loadInventory(selectedTruck);
  }, [selectedTruck, loadInventory]);

  const filtered = inventory.filter((item) => {
    const matchSearch = !search ||
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      (item.ingredientCategory ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "low" && item.needsReorder) ||
      (filterStatus === "ok" && !item.needsReorder);
    return matchSearch && matchStatus;
  });

  const stats = {
    totalIngredients: inventory.length,
    activeAlertCount: alerts.filter((a) => a.alertStatus === "active").length,
    belowThreshCount: inventory.filter((i) => i.needsReorder).length,
    outOfStockCount: inventory.filter((i) => i.quantityOnHand === 0).length,
    selectedTruckName: trucks.find((t) => t.license_plate === selectedTruck)?.truck_name ?? "",
  };

  return {
    trucks,
    selectedTruck,
    setSelectedTruck,
    inventory: filtered,
    allInventory: inventory,
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
    loadInventory,
  };
}
