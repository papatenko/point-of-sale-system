import { useState, useCallback } from "react";

const normalizeArrayResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const search = useCallback(async (term) => {
    if (!term.trim()) return;

    setLoading(true);
    setFetchError(null);
    setHasSearched(true);

    try {
      const token = localStorage.getItem("token");
      const makeAuthHeaders = () =>
        token ? { Authorization: `Bearer ${token}` } : undefined;

      const [menuRes, ingRes, empRes, supRes] = await Promise.all([
        fetch("/api/menu-items", { headers: makeAuthHeaders() }),
        fetch("/api/ingredients", { headers: makeAuthHeaders() }),
        fetch("/api/employees", { headers: makeAuthHeaders() }),
        fetch("/api/suppliers", { headers: makeAuthHeaders() }),
      ]);

      const [menuData, ingData, empData, supData] = await Promise.all([
        menuRes.json(),
        ingRes.json(),
        empRes.json(),
        supRes.json(),
      ]);

      const errors = [];
      if (!menuRes.ok) errors.push(menuData?.error || "Failed to load menu items");
      if (!ingRes.ok) errors.push(ingData?.error || "Failed to load ingredients");
      if (!empRes.ok) errors.push(empData?.error || "Failed to load employees");
      if (!supRes.ok) errors.push(supData?.error || "Failed to load suppliers");

      if (errors.length > 0) {
        setFetchError(errors.join(" | "));
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const menuItems = normalizeArrayResponse(menuData);
      const ingredients = normalizeArrayResponse(ingData);
      const employees = normalizeArrayResponse(empData);
      const suppliers = normalizeArrayResponse(supData);

      const searchTermLower = term.trim().toLowerCase();
      const matches = (...fields) =>
        fields.some((f) =>
          String(f ?? "")
            .toLowerCase()
            .includes(searchTermLower),
        );

      const out = [];
      const limit = 50;

      for (const m of menuItems) {
        if (out.length >= limit) break;
        if (!matches(m.item_name, m.description, m.category_name, m.price)) continue;
        out.push({
          type: "Menu Item",
          id: m.menu_item_id,
          title: m.item_name,
          details: [m.category_name, m.price != null ? `$${m.price}` : null].filter(Boolean).join(" - "),
        });
      }

      for (const i of ingredients) {
        if (out.length >= limit) break;
        if (!matches(i.ingredient_name, i.category, i.unit_of_measure, i.preferred_supplier_name)) continue;
        out.push({
          type: "Ingredient",
          id: i.ingredient_id,
          title: i.ingredient_name,
          details: [i.category, i.unit_of_measure, i.preferred_supplier_name].filter(Boolean).join(" - "),
        });
      }

      for (const e of employees) {
        if (out.length >= limit) break;
        if (!matches(e.first_name, e.last_name, e.email, e.role, e.license_plate)) continue;
        out.push({
          type: "Employee",
          id: e.email,
          title: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
          details: [e.role, e.email, e.license_plate].filter(Boolean).join(" - "),
        });
      }

      for (const s of suppliers) {
        if (out.length >= limit) break;
        if (!matches(s.supplier_name, s.contact_person, s.email, s.phone_number, s.address)) continue;
        out.push({
          type: "Supplier",
          id: s.supplier_id,
          title: s.supplier_name,
          details: [s.contact_person, s.email, s.phone_number].filter(Boolean).join(" - "),
        });
      }

      setSearchResults(out);
    } catch (err) {
      setFetchError("Failed to search database");
      setSearchResults([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    loading,
    hasSearched,
    searchResults,
    fetchError,
    search,
  };
}
