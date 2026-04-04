import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { UNIT_OPTIONS } from "@/constants/units";

export const Route = createFileRoute("/employee/database/ingredients")({
  component: IngredientsDatabaseComponent,
});

const COLUMNS = [
  { key: "ingredient_id", label: "ID" },
  { key: "ingredient_name", label: "Name" },
  { key: "unit_of_measure", label: "Unit" },
  { key: "current_unit_cost", label: "Unit Cost", format: (v) => `$${v}` },
];

const CREATE_FIELDS = [
  { name: "ingredient_name", label: "Name", type: "text", required: true },
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
];

function IngredientsDatabaseComponent() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchIngredients();
  }, []);

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
          unit_of_measure: formData.unit_of_measure,
          current_unit_cost: parseFloat(formData.current_unit_cost),
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
        alert(data.error || "Failed to delete ingredient");
      }
    } catch {
      alert("Failed to delete ingredient");
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
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
          fields={CREATE_FIELDS}
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
        loading={loading}
        emptyMessage="No ingredients found"
      />
    </div>
  );
}
