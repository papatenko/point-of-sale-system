import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/database/data-table";
import { CreateForm } from "@/components/database/create-form";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/employee/database/menu_items")({
  component: MenuItemsDatabaseComponent,
});

const COLUMNS = [
  { key: "menu_item_id", label: "ID" },
  { key: "item_name", label: "Name" },
  { key: "category_name", label: "Category" },
  { key: "price", label: "Price", format: (v) => `$${v}` },
];

const CREATE_FIELDS = [
  { name: "item_name", label: "Item Name", type: "text", required: true },
  {
    name: "price",
    label: "Price ($)",
    type: "number",
    step: "0.01",
    required: true,
  },
  { name: "description", label: "Description", type: "text" },
];

function MenuItemsDatabaseComponent() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_name: formData.item_name,
          price: parseFloat(formData.price),
          description: formData.description || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        fetchMenuItems();
      } else {
        setError(data.error || "Failed to create menu item");
        throw new Error(data.error);
      }
    } catch (err) {
      if (!err.message.includes("Failed to create")) {
        setError("Failed to create menu item");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/menu-items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menu_item_id: id }),
      });

      if (res.ok) {
        fetchMenuItems();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete menu item");
      }
    } catch (err) {
      alert("Failed to delete menu item");
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground">Manage your menu</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 size-4" />
          {showCreateForm ? "Cancel" : "Add Menu Item"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateForm
          title="Add New Menu Item"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setShowCreateForm(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create Menu Item"
        />
      )}

      <DataTable
        columns={COLUMNS}
        data={menuItems}
        pageSize={10}
        searchKeys={["item_name", "category_name"]}
        deleteIdKey="menu_item_id"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No menu items found"
      />
    </div>
  );
}
