import { Truck } from "lucide-react";

export function TruckFilter({ trucks, selectedTruck, onSelect, showAllOption = true }) {
  if (!trucks || trucks.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Truck size={16} className="text-muted-foreground" />
      <select
        value={selectedTruck ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {showAllOption && <option value="">All Trucks</option>}
        {trucks.map((t) => (
          <option key={t.license_plate} value={t.license_plate}>
            {t.truck_name} — {t.current_location ?? t.license_plate}
          </option>
        ))}
      </select>
    </div>
  );
}
