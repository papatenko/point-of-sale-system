import { useState, useMemo } from "react";

export function useActiveFilter(data, options = {}) {
  const { activeKey = "is_active" } = options;
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    if (statusFilter === "active") {
      return data.filter((item) => item[activeKey] === 1);
    } else if (statusFilter === "inactive") {
      return data.filter((item) => item[activeKey] === 0);
    }
    return data;
  }, [data, statusFilter, activeKey]);

  return { statusFilter, setStatusFilter, filteredData };
}
