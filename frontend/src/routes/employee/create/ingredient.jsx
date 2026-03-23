import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export const Route = createFileRoute("/employee/create/ingredient")({
  component: CreateIngredientComponent,
});

const UNIT_OPTIONS = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "l", label: "Liters (l)" },
  { value: "tsp", label: "Teaspoons (tsp)" },
  { value: "tbsp", label: "Tablespoons (tbsp)" },
  { value: "cup", label: "Cups (cup)" },
  { value: "oz", label: "Ounces (oz)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "pcs", label: "Pieces (pcs)" },
];

const CATEGORY_OPTIONS = [
  { value: "protein", label: "Protein" },
  { value: "vegetable", label: "Vegetable" },
  { value: "fruit", label: "Fruit" },
  { value: "dairy", label: "Dairy" },
  { value: "grain", label: "Grain" },
  { value: "spice", label: "Spice" },
  { value: "sauce", label: "Sauce" },
  { value: "other", label: "Other" },
];

function CreateIngredientComponent() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    ingredient_name: "",
    category: "",
    unit_of_measure: "",
    current_unit_cost: "",
    storage_time: "",
    preferred_supplier_id: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredient_name: form.ingredient_name,
          category: form.category || null,
          unit_of_measure: form.unit_of_measure,
          current_unit_cost: parseFloat(form.current_unit_cost),
          storage_time: form.storage_time ? parseInt(form.storage_time) : null,
          preferred_supplier_id: form.preferred_supplier_id || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Ingredient created successfully!");
        navigate({ to: "/employee" });
      } else {
        setError(data.error || "Failed to create ingredient");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to create ingredient. Check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((data) => {
        setSuppliers(data);
      })
      .catch(() => {
        console.error("Failed to load suppliers");
      })
      .finally(() => setSuppliersLoading(false));
  }, []);

  console.log("Suppliers:", suppliers);

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.supplier_id),
    label: s.supplier_name,
  }));

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Ingredient</CardTitle>
          <CardDescription>
            Add a new ingredient to the inventory system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Ingredient Name - full width */}
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="ingredient_name">Ingredient Name *</Label>
                <Input
                  id="ingredient_name"
                  name="ingredient_name"
                  type="text"
                  placeholder="e.g., Tomato Sauce"
                  value={form.ingredient_name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => handleSelectChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit of Measure */}
              <div className="space-y-1">
                <Label>Unit of Measure *</Label>
                <Select
                  value={form.unit_of_measure}
                  onValueChange={(v) =>
                    handleSelectChange("unit_of_measure", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Cost */}
              <div className="space-y-1">
                <Label htmlFor="current_unit_cost">Unit Cost ($) *</Label>
                <Input
                  id="current_unit_cost"
                  name="current_unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.current_unit_cost}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Storage Time */}
              <div className="space-y-1">
                <Label htmlFor="storage_time">Storage Time (days)</Label>
                <Input
                  id="storage_time"
                  name="storage_time"
                  type="number"
                  min="0"
                  placeholder="e.g., 30"
                  value={form.storage_time}
                  onChange={handleChange}
                />
              </div>

              {/* Preferred Supplier */}
              <div className="space-y-1 md:col-span-2">
                <Label>Preferred Supplier</Label>
                {suppliersLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading suppliers...
                  </p>
                ) : suppliers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No suppliers available.
                  </p>
                ) : (
                  <Combobox
                    items={supplierOptions}
                    value={form.preferred_supplier_id}
                    onValueChange={(v) =>
                      handleSelectChange("preferred_supplier_id", v)
                    }
                  >
                    <ComboboxInput placeholder="Select a supplier (optional)" />
                    <ComboboxContent>
                      <ComboboxEmpty>No suppliers found.</ComboboxEmpty>
                      <ComboboxList>
                        {supplierOptions.map((s) => (
                          <ComboboxItem key={s.value} value={s.value}>
                            {s.label}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/employee" })}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating..." : "Create Ingredient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
