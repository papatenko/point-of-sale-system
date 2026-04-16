import { Users } from "lucide-react";

export function StatusFilter({ statusFilter, onSelect, label, options }) {
  const { activeLabel = "Active", inactiveLabel = "Inactive" } = options || {};

  return (
    <div className="flex items-center gap-2">
      <Users size={16} className="text-muted-foreground" />
      <select
        value={statusFilter}
        onChange={(e) => onSelect(e.target.value)}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <option value="all">All {label}</option>
        <option value="active">{activeLabel}</option>
        <option value="inactive">{inactiveLabel}</option>
      </select>
    </div>
  );
}
