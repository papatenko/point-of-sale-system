import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { CreateForm } from "@/components/database/create-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

function RecipesDatabaseComponent() {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (formData) => {
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
          menu_item_id: parseInt(formData.menu_item_id),
          ingredient_id: parseInt(formData.ingredient_id),
          quantity_needed: parseFloat(formData.quantity_needed),
          instructions: formData.instructions || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchRecipes();
      } else {
        setError(data.error || "Failed to create recipe");
        return false;
      }
    } catch {
      setError("Failed to create recipe");
      return false;
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
    } catch {
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
          <p className="text-muted-foreground">
            Manage menu item ingredients and quantities
          </p>
        </div>
        <AddDialog
          triggerLabel="Add Recipe"
          title="Add Recipe Ingredient"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Add"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label>
                Menu Item <span className="text-destructive"> *</span>
              </Label>
              <Select name="menu_item_id" required>
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
              <Select name="ingredient_id" required>
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
              <Input
                id="quantity_needed"
                name="quantity_needed"
                type="number"
                step="0.01"
                placeholder="e.g., 100"
                required
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="instructions">Instructions</Label>
              <Input
                id="instructions"
                name="instructions"
                type="text"
                placeholder="Optional preparation notes"
              />
            </div>
          </div>
        </AddDialog>
      </div>

      <DataTable
        columns={COLUMNS}
        data={enrichedRecipes}
        pageSize={10}
        searchKeys={["menu_item_name", "ingredient_name", "instructions"]}
        deleteIdKey="recipe_id"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No recipes found. Add ingredients to menu items."
      />
    </div>
  );
}
