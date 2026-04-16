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
import { EditDialog } from "@/components/common/edit-dialog";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";
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
  X,
  Utensils,
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

const AVAILABILITY_OPTIONS = [
  { value: "true", label: "Available" },
  { value: "false", label: "Unavailable" },
];

const EDIT_FIELDS = [
  { name: "item_name", label: "Item Name", type: "text", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: CATEGORY_OPTIONS,
  },
  {
    name: "price",
    label: "Price ($)",
    type: "number",
    step: "0.01",
    min: 0,
    required: true,
  },
  { name: "image_url", label: "Image URL", type: "url" },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    rows: 2,
  },
  {
    name: "is_available",
    label: "Availability",
    type: "select",
    options: AVAILABILITY_OPTIONS,
  },
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingRecipeIngredients, setPendingRecipeIngredients] = useState([]);
  const [editForm, setEditForm] = useState({});
  const [editRecipeOpen, setEditRecipeOpen] = useState(false);
  const [editRecipeForm, setEditRecipeForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { alertConfig, showAlert, hideAlert, AlertPopupComponent } =
    useAlertPopup();

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
    setSelectedItem({
      ...item,
      category: item.category ? String(item.category) : "",
      is_available: item.is_available ? "true" : "false",
    });
    setEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    if (pendingRecipeIngredients.length === 0) {
      showAlert({
        title: "Missing Ingredients",
        description: "At least one recipe ingredient is required.",
        variant: "warning",
      });
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
      showAlert({
        title: "Error Creating Menu Item",
        description: data.error || "Failed to create menu item",
        variant: "error",
      });
    }
  };

  const handleEditSubmit = async (formData) => {
    const body = {
      menu_item_id: selectedItem.menu_item_id,
      item_name: formData.item_name,
      category: formData.category ? parseInt(formData.category) : null,
      price: parseFloat(formData.price),
      description: formData.description || null,
      image_url: formData.image_url || null,
      is_available: formData.is_available === "true",
    };

    const res = await fetch("/api/menu-items", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      fetchMenuItems();
      return true;
    } else {
      showAlert({
        title: "Error Updating Menu Item",
        description: data.error || "Failed to update menu item",
        variant: "error",
      });
      return false;
    }
  };

  const handleAddRecipeIngredient = (
    ingredient_id,
    quantity_needed,
    instructions,
  ) => {
    if (!ingredient_id || !quantity_needed) {
      showAlert({
        title: "Missing Information",
        description: "Please select an ingredient and enter a quantity.",
        variant: "warning",
      });
      return;
    }
    if (
      pendingRecipeIngredients.some((r) => r.ingredient_id === ingredient_id)
    ) {
      showAlert({
        title: "Duplicate Ingredient",
        description: "This ingredient is already in the recipe.",
        variant: "warning",
      });
      return;
    }
    setPendingRecipeIngredients((prev) => [
      ...prev,
      { ingredient_id, quantity_needed, instructions },
    ]);
  };

  const handleRemovePendingRecipeIngredient = (ingredient_id) => {
    setPendingRecipeIngredients((prev) =>
      prev.filter((r) => r.ingredient_id !== ingredient_id),
    );
  };

  const [deleteRecipeOpen, setDeleteRecipeOpen] = useState(false);
  const [deleteRecipeId, setDeleteRecipeId] = useState(null);

  const handleDeleteRecipeIngredient = async () => {
    const res = await fetch("/api/recipes", {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ recipe_id: deleteRecipeId }),
    });
    if (res.ok) {
      setDeleteRecipeOpen(false);
      setDeleteRecipeId(null);
      fetchMenuItems();
    } else {
      const data = await res.json();
      showAlert({
        title: "Error Deleting Ingredient",
        description: data.error || "Failed to delete recipe ingredient",
        variant: "error",
      });
    }
  };

  const handleAddExistingRecipeIngredient = async (
    menu_item_id,
    ingredient_id,
    quantity_needed,
    instructions,
  ) => {
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
      showAlert({
        title: "Error Adding Ingredient",
        description: data.error || "Failed to add recipe ingredient",
        variant: "error",
      });
    }
  };

  const openEditRecipeDialog = (recipe) => {
    setEditRecipeForm({
      recipe_id: recipe.recipe_id,
      ingredient_name: recipe.ingredient_name,
      unit_of_measure: recipe.unit_of_measure,
      quantity_needed: recipe.quantity_needed,
      instructions: recipe.instructions || "",
    });
    setEditRecipeOpen(true);
  };

  const handleEditRecipeSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    const res = await fetch("/api/recipes", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        recipe_id: editRecipeForm.recipe_id,
        quantity_needed: parseFloat(fd.get("quantity_needed")),
        instructions: fd.get("instructions") || null,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setEditRecipeOpen(false);
      fetchMenuItems();
    } else {
      showAlert({
        title: "Error Updating Ingredient",
        description: data.error || "Failed to update recipe ingredient",
        variant: "error",
      });
    }
  };

  const getIngredientName = (id) => {
    const ing = ingredients.find((i) => i.ingredient_id === id);
    return ing
      ? `${ing.ingredient_name} (${ing.unit_of_measure})`
      : `ID: ${id}`;
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.item_name?.toLowerCase().includes(q) ||
      item.category_name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.price?.toString().includes(q) ||
      item.recipes?.some((r) => r.ingredient_name?.toLowerCase().includes(q))
    );
  });

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
      <AlertPopupComponent />
      <AlertPopup
        open={deleteRecipeOpen}
        onOpenChange={setDeleteRecipeOpen}
        title="Delete Recipe Ingredient"
        description="Are you sure you want to remove this ingredient from the recipe?"
        variant="destructive"
        onConfirm={handleDeleteRecipeIngredient}
        confirmLabel="Delete"
      />
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground text-sm">
            Manage menu items and their recipes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={openCreateDialog}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            <Plus className="mr-2 size-4" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {filteredMenuItems.length === 0 && menuItems.length > 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No menu items match your search.
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No menu items found. Add one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMenuItems.map((item) => (
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
                    <Badge
                      variant="secondary"
                      className="bg-white/90 dark:bg-black/70"
                    >
                      {item.category_name || "Uncategorized"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-base leading-tight">
                      {item.item_name}
                    </h3>
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
                    <div className="flex items-center justify-between">
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
                          <ChevronUp className="size-3.5 ml-1" />
                        ) : (
                          <ChevronDown className="size-3.5 ml-1" />
                        )}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>

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
                                    {parseFloat(r.quantity_needed)}{" "}
                                    {r.unit_of_measure}
                                    {r.instructions && (
                                      <span className="ml-1 italic text-[10px]">
                                        — {r.instructions}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setDeleteRecipeId(r.recipe_id);
                                    setDeleteRecipeOpen(true);
                                  }}
                                  title="Remove ingredient"
                                >
                                  <X className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => openEditRecipeDialog(r)}
                                  title="Edit ingredient"
                                >
                                  <Pencil className="size-3" />
                                </Button>
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
                          onError={showAlert}
                        />
                      </div>
                    )}
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
                <Input
                  name="item_name"
                  required
                  placeholder="e.g., Chicken Shawarma Wrap"
                />
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
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input
                name="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                name="description"
                placeholder="Describe the dish..."
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label>
                  Recipe Ingredients <span className="text-destructive">*</span>
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
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        handleRemovePendingRecipeIngredient(r.ingredient_id)
                      }
                      title="Remove ingredient"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {pendingRecipeIngredients.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No ingredients added yet. Use the form below to add at least
                    one.
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

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        title="Edit Menu Item"
        fields={EDIT_FIELDS}
        initialData={selectedItem || {}}
        onSubmit={handleEditSubmit}
        onSuccess={() => {}}
        isSubmitting={false}
        submitLabel="Save Changes"
      />

      <Dialog open={editRecipeOpen} onOpenChange={setEditRecipeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Recipe Ingredient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditRecipeSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Ingredient</Label>
              <div className="flex h-9 w-full min-w-0 rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
                {editRecipeForm.ingredient_name} (
                {editRecipeForm.unit_of_measure})
              </div>
            </div>
            <div className="space-y-1">
              <Label>
                Quantity Needed <span className="text-destructive">*</span>
              </Label>
              <Input
                name="quantity_needed"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editRecipeForm.quantity_needed}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Instructions</Label>
              <Input
                name="instructions"
                type="text"
                placeholder="Optional preparation notes"
                defaultValue={editRecipeForm.instructions}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRecipeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
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

function InlineRecipeForm({ menuItemId, ingredients, onAdd, onError }) {
  const [ingredient_id, setIngredientId] = useState("");
  const [quantity_needed, setQuantityNeeded] = useState("");
  const [instructions, setInstructions] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!ingredient_id || !quantity_needed) {
      onError?.({
        title: "Missing Information",
        description: "Please select an ingredient and enter a quantity.",
        variant: "warning",
      });
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
