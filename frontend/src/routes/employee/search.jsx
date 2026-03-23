import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export const Route = createFileRoute("/employee/search")({
  component: RouteComponent,
});

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

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

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("token");

      const makeAuthHeaders = () =>
        token ? { Authorization: `Bearer ${token}` } : undefined;

      const [menuRes, ingRes, empRes, supRes] = await Promise.all([
        fetch("/api/menu-items", {
          headers: makeAuthHeaders(),
        }),
        fetch("/api/ingredients", {
          headers: makeAuthHeaders(),
        }),
        fetch("/api/employees", {
          headers: makeAuthHeaders(),
        }),
        fetch("/api/suppliers", {
          headers: makeAuthHeaders(),
        }),
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
        setMenuItems([]);
        setIngredients([]);
        setEmployees([]);
        setSuppliers([]);
        return;
      }

      setMenuItems(normalizeArrayResponse(menuData));
      setIngredients(normalizeArrayResponse(ingData));
      setEmployees(normalizeArrayResponse(empData));
      setSuppliers(normalizeArrayResponse(supData));
    } catch (err) {
      setFetchError("Failed to load database entries");
      setMenuItems([]);
      setIngredients([]);
      setEmployees([]);
      setSuppliers([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const term = searchTerm.trim().toLowerCase();

  const results = useMemo(() => {
    const matches = (...fields) =>
      fields.some((f) =>
        String(f ?? "")
          .toLowerCase()
          .includes(term),
      );

    const out = [];

    const limit = 50;

    for (const m of menuItems) {
      const hit = term.length === 0
        ? true
        : matches(m.item_name, m.description, m.category_name, m.price);
      if (!hit) continue;
      out.push({
        type: "Menu Item",
        id: m.menu_item_id,
        title: m.item_name,
        details: [m.category_name, m.price != null ? `$${m.price}` : null].filter(Boolean).join(" - "),
      });
      if (out.length >= limit) break;
    }

    for (const i of ingredients) {
      if (out.length >= limit) break;
      const hit =
        term.length === 0
          ? true
          : matches(i.ingredient_name, i.category, i.unit_of_measure, i.preferred_supplier_name);
      if (!hit) continue;
      out.push({
        type: "Ingredient",
        id: i.ingredient_id,
        title: i.ingredient_name,
        details: [i.category, i.unit_of_measure, i.preferred_supplier_name].filter(Boolean).join(" - "),
      });
    }

    for (const e of employees) {
      if (out.length >= limit) break;
      const hit =
        term.length === 0
          ? true
          : matches(e.first_name, e.last_name, e.email, e.role, e.license_plate);
      if (!hit) continue;
      out.push({
        type: "Employee",
        id: e.email,
        title: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
        details: [e.role, e.email, e.license_plate].filter(Boolean).join(" - "),
      });
    }

    for (const s of suppliers) {
      if (out.length >= limit) break;
      const hit =
        term.length === 0
          ? true
          : matches(s.supplier_name, s.contact_person, s.email, s.phone_number, s.address);
      if (!hit) continue;
      out.push({
        type: "Supplier",
        id: s.supplier_id,
        title: s.supplier_name,
        details: [s.contact_person, s.email, s.phone_number].filter(Boolean).join(" - "),
      });
    }

    return out;
  }, [term, menuItems, ingredients, employees, suppliers]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Search Screen</h1>
          <p className="text-muted-foreground">Search across menu items, ingredients, employees, and suppliers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search anything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <p className="text-destructive text-sm py-2">{fetchError}</p>
          ) : loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground">No results found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={`${r.type}-${r.id}`}>
                      <TableCell className="whitespace-nowrap text-sm">{r.type}</TableCell>
                      <TableCell className="text-sm">{r.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.details || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
