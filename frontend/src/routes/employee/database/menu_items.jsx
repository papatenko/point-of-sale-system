import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  X,
  Utensils,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/employee/database/menu_items")({
  component: MenuItemsDatabaseComponent,
});

const CATEGORY_OPTIONS = [
  { value: "1", label: "Appetizers" },
  { value: "2", label: "Entrees" },
  { value: "3", label: "Sides" },
  { value: "4", label: "Desserts" },
  { value: "5", label: "Drinks" },
];

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function MenuItemsDatabaseComponent() {
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecipes, setExpandedRecipes] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingRecipeIngredients, setPendingRecipeIngredients] = useState([]);
  const [editForm, setEditForm] = useState({});

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await fetch("/api/menu-items", { headers: authHeaders() });
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIngredients = useCallback(async () => {
    try {
      const res = await fetch("/api/ingredients", { headers: authHeaders() });
      const data = await res.json();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
    fetchIngredients();
  }, [fetchMenuItems, fetchIngredients]);

  const toggleRecipes = (id) => {
    setExpandedRecipes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateDialog = () => {
    setPendingRecipeIngredients([]);
    setCreateOpen(true);
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setEditForm({
      item_name: item.item_name,
      category: item.category ? String(item.category) : "",
      price: item.price,
      description: item.description || "",
      image_url: item.image_url || "",
      is_available: item.is_available ? "true" : "false",
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    if (pendingRecipeIngredients.length === 0) {
      alert("At least one recipe ingredient is required.");
      return;
    }

    const body = {
      item_name: fd.get("item_name"),
      category: fd.get("category") ? parseInt(fd.get("category")) : null,
      price: parseFloat(fd.get("price")),
      description: fd.get("description") || null,
      image_url: fd.get("image_url") || null,
      recipes: pendingRecipeIngredients.map((r) => ({
        ingredient_id: parseInt(r.ingredient_id),
        quantity_needed: parseFloat(r.quantity_needed),
        instructions: r.instructions || null,
      })),
    };

    const res = await fetch("/api/menu-items-with-recipes", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setCreateOpen(false);
      setPendingRecipeIngredients([]);
      fetchMenuItems();
    } else {
      alert(data.error || "Failed to create menu item");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    const body = {
      menu_item_id: selectedItem.menu_item_id,
      item_name: fd.get("item_name"),
      category: fd.get("category") ? parseInt(fd.get("category")) : null,
      price: parseFloat(fd.get("price")),
      description: fd.get("description") || null,
      image_url: fd.get("image_url") || null,
      is_available: fd.get("is_available") === "true",
    };

    const res = await fetch("/api/menu-items", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setEditOpen(false);
      fetchMenuItems();
    } else {
      alert(data.error || "Failed to update menu item");
    }
  };

  const handleDelete = async () => {
    const res = await fetch("/api/menu-items", {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ menu_item_id: selectedItem.menu_item_id }),
    });

    if (res.ok) {
      setDeleteOpen(false);
      fetchMenuItems();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete menu item");
    }
  };

  const handleAddRecipeIngredient = (ingredient_id, quantity_needed, instructions) => {
    if (!ingredient_id || !quantity_needed) {
      alert("Please select an ingredient and enter a quantity.");
      return;
    }
    if (pendingRecipeIngredients.some((r) => r.ingredient_id === ingredient_id)) {
      alert("This ingredient is already in the recipe.");
      return;
    }
    setPendingRecipeIngredients((prev) => [
      ...prev,
      { ingredient_id, quantity_needed, instructions },
    ]);
  };

  const handleRemovePendingRecipeIngredient = (ingredient_id) => {
    setPendingRecipeIngredients((prev) =>
      prev.filter((r) => r.ingredient_id !== ingredient_id)
    );
  };

  const handleDeleteRecipeIngredient = async (recipe_id) => {
    if (!confirm("Delete this recipe ingredient?")) return;
    const res = await fetch("/api/recipes", {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ recipe_id }),
    });
    if (res.ok) {
      fetchMenuItems();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete recipe ingredient");
    }
  };

  const handleAddExistingRecipeIngredient = async (menu_item_id, ingredient_id, quantity_needed, instructions) => {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        menu_item_id: parseInt(menu_item_id),
        ingredient_id: parseInt(ingredient_id),
        quantity_needed: parseFloat(quantity_needed),
        instructions: instructions || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchMenuItems();
    } else {
      alert(data.error || "Failed to add recipe ingredient");
    }
  };

  const getIngredientName = (id) => {
    const ing = ingredients.find((i) => i.ingredient_id === id);
    return ing ? `${ing.ingredient_name} (${ing.unit_of_measure})` : `ID: ${id}`;
  };

  const ingredientOptions = ingredients.map((i) => ({
    value: String(i.ingredient_id),
    label: `${i.ingredient_name} (${i.unit_of_measure})`,
  }));

  if (loading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <div className="text-muted-foreground">Loading menu items...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground text-sm">
            Manage menu items and their recipes
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="mr-2 size-4" />
          Add Menu Item
        </Button>
      </div>

      {menuItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No menu items found. Add one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {menuItems.map((item) => (
            <Card key={item.menu_item_id} className="flex flex-col">
              <CardContent className="p-0 flex flex-col flex-1">
                <div className="relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-44 object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="w-full h-44 bg-amber-100 dark:bg-amber-900/30 rounded-t-xl flex items-center justify-center">
                      <Utensils className="size-10 text-amber-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-black/70">
                      {item.category_name || "Uncategorized"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-base leading-tight">{item.item_name}</h3>
                    <span className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {!item.is_available && (
                    <Badge variant="destructive" className="mb-2 w-fit">
                      Unavailable
                    </Badge>
                  )}

                  <div className="mt-auto space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleRecipes(item.menu_item_id)}
                      className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"
                    >
                      <Utensils className="size-3.5" />
                      Recipes
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-full">
                        {item.recipes?.length || 0}
                      </span>
                      {expandedRecipes[item.menu_item_id] ? (
                        <ChevronUp className="size-3.5 ml-auto" />
                      ) : (
                        <ChevronDown className="size-3.5 ml-auto" />
                      )}
                    </button>

                    {expandedRecipes[item.menu_item_id] && (
                      <div className="space-y-2 border rounded-lg p-3 bg-muted/30 text-sm">
                        {item.recipes && item.recipes.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.recipes.map((r) => (
                              <div
                                key={r.recipe_id}
                                className="flex items-start justify-between gap-2 py-1 border-b last:border-0 border-border"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-xs truncate">
                                    {r.ingredient_name}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {parseFloat(r.quantity_needed)} {r.unit_of_measure}
                                    {r.instructions && (
                                      <span className="ml-1 italic text-[10px]">
                                        — {r.instructions}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecipeIngredient(r.recipe_id)}
                                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                  title="Remove ingredient"
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            No recipe ingredients yet.
                          </p>
                        )}

                        <InlineRecipeForm
                          menuItemId={item.menu_item_id}
                          ingredients={ingredients}
                          onAdd={handleAddExistingRecipeIngredient}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="size-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDeleteDialog(item)}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label>
                  Item Name <span className="text-destructive">*</span>
                </Label>
                <Input name="item_name" required placeholder="e.g., Chicken Shawarma Wrap" />
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label>Category</Label>
                <Select name="category">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label>
                  Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input name="price" type="number" step="0.01" min="0" required placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input name="image_url" type="url" placeholder="https://example.com/image.jpg" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea name="description" placeholder="Describe the dish..." rows={2} />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label>
                  Recipe Ingredients{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {pendingRecipeIngredients.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {pendingRecipeIngredients.length} added
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-3">
                {pendingRecipeIngredients.map((r) => (
                  <div
                    key={r.ingredient_id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
                  >
                    <span className="flex-1 truncate">
                      {getIngredientName(parseInt(r.ingredient_id))}
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {r.quantity_needed}
                    </span>
                    {r.instructions && (
                      <span className="text-muted-foreground text-xs italic max-w-[150px] truncate hidden sm:inline">
                        {r.instructions}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePendingRecipeIngredient(r.ingredient_id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {pendingRecipeIngredients.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No ingredients added yet. Use the form below to add at least one.
                  </p>
                )}
              </div>

              <PendingRecipeBuilder
                ingredients={ingredientOptions}
                onAdd={handleAddRecipeIngredient}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={pendingRecipeIngredients.length === 0}
              >
                Create Menu Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label>
                  Item Name <span className="text-destructive">*</span>
                </Label>
                <Input name="item_name" defaultValue={editForm.item_name} required />
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label>Category</Label>
                <Select name="category" defaultValue={editForm.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label>
                  Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editForm.price}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input name="image_url" type="url" defaultValue={editForm.image_url} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea name="description" rows={2} defaultValue={editForm.description} />
            </div>
            <div className="space-y-1">
              <Label>Availability</Label>
              <Select name="is_available" defaultValue={editForm.is_available}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              Are you sure you want to delete <strong>"{selectedItem?.item_name}"</strong>?
            </p>
            {selectedItem?.recipes && selectedItem.recipes.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
                <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-amber-800 dark:text-amber-300">
                  This will also permanently remove{" "}
                  <strong>{selectedItem.recipes.length}</strong> associated recipe
                  {selectedItem.recipes.length !== 1 ? "s" : ""}.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PendingRecipeBuilder({ ingredients, onAdd }) {
  const [ingredient_id, setIngredientId] = useState("");
  const [quantity_needed, setQuantityNeeded] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleAdd = () => {
    onAdd(ingredient_id, quantity_needed, instructions);
    setIngredientId("");
    setQuantityNeeded("");
    setInstructions("");
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[160px] space-y-1">
        <Label className="text-xs">Ingredient</Label>
        <Select value={ingredient_id} onValueChange={setIngredientId}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {ingredients.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-xs">Qty</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Qty"
          value={quantity_needed}
          onChange={(e) => setQuantityNeeded(e.target.value)}
        />
      </div>
      <div className="flex-[2] min-w-[140px] space-y-1">
        <Label className="text-xs">Instructions</Label>
        <Input
          placeholder="Optional notes"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="shrink-0"
      >
        <Plus className="size-3.5 mr-1" />
        Add
      </Button>
    </div>
  );
}

function InlineRecipeForm({ menuItemId, ingredients, onAdd }) {
  const [ingredient_id, setIngredientId] = useState("");
  const [quantity_needed, setQuantityNeeded] = useState("");
  const [instructions, setInstructions] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!ingredient_id || !quantity_needed) {
      alert("Please select an ingredient and enter a quantity.");
      return;
    }
    setAdding(true);
    await onAdd(menuItemId, ingredient_id, quantity_needed, instructions);
    setIngredientId("");
    setQuantityNeeded("");
    setInstructions("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-border/50">
      <div className="flex-1 min-w-[140px]">
        <Select value={ingredient_id} onValueChange={setIngredientId}>
          <SelectTrigger>
            <SelectValue placeholder="Add ingredient..." />
          </SelectTrigger>
          <SelectContent>
            {ingredients.map((i) => (
              <SelectItem key={i.ingredient_id} value={String(i.ingredient_id)}>
                {i.ingredient_name} ({i.unit_of_measure})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-20">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Qty"
          value={quantity_needed}
          onChange={(e) => setQuantityNeeded(e.target.value)}
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <Input
          placeholder="Notes"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAdd}
        disabled={adding || !ingredient_id || !quantity_needed}
        className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
      >
        <Plus className="size-3.5 mr-1" />
        {adding ? "Adding..." : "Add"}
      </Button>
    </div>
  );
}
