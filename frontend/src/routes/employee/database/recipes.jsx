import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/database/data-table";
import { CreateForm } from "@/components/database/create-form";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/employee/database/recipes")({
  component: RecipesDatabaseComponent,
});

const COLUMNS = [
  { key: "menu_item_name", label: "Menu Item" },
  { key: "ingredient_name", label: "Ingredient" },
  { key: "unit_of_measure", label: "Unit" },
  { key: "quantity_needed", label: "Quantity" },
  { key: "instructions", label: "Instructions" },
];

const CREATE_FIELDS = [
  { name: "menu_item_id", label: "Menu Item", type: "text" },
  { name: "ingredient_id", label: "Ingredient", type: "text" },
  { name: "quantity_needed", label: "Quantity Needed", type: "number", step: "0.01", required: true },
  { name: "instructions", label: "Instructions", type: "text" },
];

function RecipesDatabaseComponent() {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    menu_item_id: "",
    ingredient_id: "",
    quantity_needed: "",
    instructions: "",
  });

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/recipes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/menu-items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    }
  };

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
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchMenuItems();
    fetchIngredients();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menu_item_id: parseInt(form.menu_item_id),
          ingredient_id: parseInt(form.ingredient_id),
          quantity_needed: parseFloat(form.quantity_needed),
          instructions: form.instructions || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setForm({ menu_item_id: "", ingredient_id: "", quantity_needed: "", instructions: "" });
        setShowCreateForm(false);
        fetchRecipes();
      } else {
        setError(data.error || "Failed to create recipe");
      }
    } catch (err) {
      setError("Failed to create recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/recipes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipe_id: id }),
      });

      if (res.ok) {
        fetchRecipes();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete recipe");
      }
    } catch (err) {
      alert("Failed to delete recipe");
    }
  };

  const getMenuItemName = (id) => {
    const item = menuItems.find((m) => m.menu_item_id === id);
    return item?.item_name || `ID: ${id}`;
  };

  const getIngredientName = (id) => {
    const ing = ingredients.find((i) => i.ingredient_id === id);
    return ing?.ingredient_name || `ID: ${id}`;
  };

  const enrichedRecipes = recipes.map((r) => ({
    ...r,
    menu_item_name: getMenuItemName(r.menu_item_id),
    ingredient_name: getIngredientName(r.ingredient_id),
  }));

  const menuItemOptions = menuItems.map((m) => ({
    value: String(m.menu_item_id),
    label: m.item_name,
  }));

  const ingredientOptions = ingredients.map((i) => ({
    value: String(i.ingredient_id),
    label: `${i.ingredient_name} (${i.unit_of_measure})`,
  }));

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Recipes</h1>
          <p className="text-muted-foreground">Manage menu item ingredients and quantities</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add Recipe"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Recipe Ingredient</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>
                    Menu Item <span className="text-destructive"> *</span>
                  </Label>
                  <Select
                    value={form.menu_item_id}
                    onValueChange={(v) => handleSelectChange("menu_item_id", v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select menu item" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItemOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>
                    Ingredient <span className="text-destructive"> *</span>
                  </Label>
                  <Select
                    value={form.ingredient_id}
                    onValueChange={(v) => handleSelectChange("ingredient_id", v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="quantity_needed">
                    Quantity Needed <span className="text-destructive"> *</span>
                  </Label>
                  <input
                    id="quantity_needed"
                    name="quantity_needed"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100"
                    value={form.quantity_needed}
                    onChange={handleChange}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="instructions">Instructions</Label>
                  <input
                    id="instructions"
                    name="instructions"
                    type="text"
                    placeholder="Optional preparation notes"
                    value={form.instructions}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                    setForm({ menu_item_id: "", ingredient_id: "", quantity_needed: "", instructions: "" });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Add Recipe"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={COLUMNS}
        data={enrichedRecipes}
        limit={5}
        searchKeys={["menu_item_name", "ingredient_name", "instructions"]}
        deleteIdKey="recipe_id"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No recipes found. Add ingredients to menu items."
      />
    </div>
  );
}
