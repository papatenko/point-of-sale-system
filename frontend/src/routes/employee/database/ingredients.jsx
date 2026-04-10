import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { UNIT_OPTIONS, CATEGORY_OPTIONS } from "@/constants/units";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";

export const Route = createFileRoute("/employee/database/ingredients")({
  component: IngredientsDatabaseComponent,
});

const COLUMNS = [
  { key: "ingredient_id", label: "ID" },
  { key: "ingredient_name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "unit_of_measure", label: "Unit" },
  { key: "current_unit_cost", label: "Unit Cost", format: (v) => `$${v}` },
  { key: "storage_time", label: "Storage (days)" },
  { key: "preferred_supplier_name", label: "Preferred Supplier" },
];

const CREATE_FIELDS = [
  { name: "ingredient_name", label: "Name", type: "text", required: true },
  { name: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  {
    name: "unit_of_measure",
    label: "Unit",
    type: "select",
    options: UNIT_OPTIONS,
    required: true,
  },
  {
    name: "current_unit_cost",
    label: "Unit Cost ($)",
    type: "number",
    step: "0.01",
    required: true,
  },
  { name: "storage_time", label: "Storage Time (days)", type: "number" },
  { name: "preferred_supplier_id", label: "Preferred Supplier", type: "select", options: [] },
];

function IngredientsDatabaseComponent() {
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { alertConfig, showAlert, hideAlert, AlertPopupComponent } = useAlertPopup();

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ingredients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchSuppliers();
  }, []);

  const supplierOptions = suppliers.map((s) => ({ value: String(s.supplier_id), label: s.supplier_name }));

  const CREATE_FIELDS_WITH_SUPPLIERS = CREATE_FIELDS.map((f) =>
    f.name === "preferred_supplier_id" ? { ...f, options: supplierOptions } : f
  );

  const openEditDialog = (ingredient) => {
    setSelectedIngredient(ingredient);
    setEditForm({
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      category: ingredient.category || "",
      unit_of_measure: ingredient.unit_of_measure,
      current_unit_cost: ingredient.current_unit_cost,
      storage_time: ingredient.storage_time || "",
      preferred_supplier_id: ingredient.preferred_supplier_id ? String(ingredient.preferred_supplier_id) : "",
    });
    setEditOpen(true);
  };

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredient_name: formData.ingredient_name,
          category: formData.category || null,
          unit_of_measure: formData.unit_of_measure,
          current_unit_cost: parseFloat(formData.current_unit_cost),
          storage_time: formData.storage_time ? parseInt(formData.storage_time) : null,
          preferred_supplier_id: formData.preferred_supplier_id || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchIngredients();
      } else {
        setError(data.error || "Failed to create ingredient");
        return false;
      }
    } catch {
      setError("Failed to create ingredient");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/ingredients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredient_id: parseInt(data.ingredient_id),
          ingredient_name: data.ingredient_name,
          category: data.category || null,
          unit_of_measure: data.unit_of_measure,
          current_unit_cost: parseFloat(data.current_unit_cost),
          storage_time: data.storage_time ? parseInt(data.storage_time) : null,
          preferred_supplier_id: data.preferred_supplier_id || null,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        fetchIngredients();
        setEditOpen(false);
      } else {
        setError(result.error || "Failed to update ingredient");
      }
    } catch {
      setError("Failed to update ingredient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/ingredients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredient_id: id }),
      });

      if (res.ok) {
        fetchIngredients();
      } else {
        const data = await res.json();
        showAlert({
          title: "Error Deleting Ingredient",
          description: data.error || "Failed to delete ingredient",
          variant: "error",
        });
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to delete ingredient",
        variant: "error",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <AlertPopupComponent />
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Ingredients</h1>
          <p className="text-muted-foreground">
            Manage your ingredient inventory
          </p>
        </div>
        <AddDialog
          triggerLabel="Add Ingredient"
          title="Add New Ingredient"
          fields={CREATE_FIELDS_WITH_SUPPLIERS}
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={ingredients}
        pageSize={10}
        searchKeys={["ingredient_name"]}
        deleteIdKey="ingredient_id"
        onDelete={handleDelete}
        onEdit={openEditDialog}
        loading={loading}
        emptyMessage="No ingredients found"
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <input type="hidden" name="ingredient_id" value={editForm.ingredient_id} />
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label htmlFor="ingredient_name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="ingredient_name"
                    name="ingredient_name"
                    type="text"
                    defaultValue={editForm.ingredient_name}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={editForm.category}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select...</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label htmlFor="unit_of_measure" className="text-sm font-medium">
                    Unit <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="unit_of_measure"
                    name="unit_of_measure"
                    defaultValue={editForm.unit_of_measure}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select...</option>
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label htmlFor="current_unit_cost" className="text-sm font-medium">
                    Unit Cost ($) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="current_unit_cost"
                    name="current_unit_cost"
                    type="number"
                    step="0.01"
                    defaultValue={editForm.current_unit_cost}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label htmlFor="storage_time" className="text-sm font-medium">
                    Storage Time (days)
                  </label>
                  <input
                    id="storage_time"
                    name="storage_time"
                    type="number"
                    defaultValue={editForm.storage_time}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label htmlFor="preferred_supplier_id" className="text-sm font-medium">
                    Preferred Supplier
                  </label>
                  <select
                    id="preferred_supplier_id"
                    name="preferred_supplier_id"
                    defaultValue={editForm.preferred_supplier_id}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select...</option>
                    {supplierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
