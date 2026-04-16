import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { EditDialog } from "@/components/common/edit-dialog";
import { UNIT_OPTIONS, CATEGORY_OPTIONS } from "@/constants/units";
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
    setSelectedIngredient({
      ...ingredient,
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

  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/ingredients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredient_id: parseInt(selectedIngredient.ingredient_id),
          ingredient_name: formData.ingredient_name,
          category: formData.category || null,
          unit_of_measure: formData.unit_of_measure,
          current_unit_cost: parseFloat(formData.current_unit_cost),
          storage_time: formData.storage_time ? parseInt(formData.storage_time) : null,
          preferred_supplier_id: formData.preferred_supplier_id || null,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        fetchIngredients();
        return true;
      } else {
        showAlert({
          title: "Error Updating Ingredient",
          description: result.error || "Failed to update ingredient",
          variant: "error",
        });
        return false;
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to update ingredient",
        variant: "error",
      });
      return false;
    } finally {
      setIsSubmitting(false);
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
        onEdit={openEditDialog}
        loading={loading}
        emptyMessage="No ingredients found"
      />

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        title="Edit Ingredient"
        fields={CREATE_FIELDS_WITH_SUPPLIERS}
        initialData={selectedIngredient || {}}
        onSubmit={handleEditSubmit}
        onSuccess={() => {}}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  );
}
