import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/database/data-table";
import { CreateForm } from "@/components/database/create-form";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/employee/database/suppliers")({
  component: SuppliersDatabaseComponent,
});

const COLUMNS = [
  { key: "supplier_id", label: "ID" },
  { key: "supplier_name", label: "Name" },
  { key: "contact_person", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "phone_number", label: "Phone" },
];

const CREATE_FIELDS = [
  {
    name: "supplier_name",
    label: "Supplier Name",
    type: "text",
    required: true,
  },
  { name: "contact_person", label: "Contact Person", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone_number", label: "Phone", type: "text" },
  { name: "address", label: "Address", type: "text" },
];

function SuppliersDatabaseComponent() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplier_name: formData.supplier_name,
          contact_person: formData.contact_person || null,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        fetchSuppliers();
      } else {
        setError(data.error || "Failed to create supplier");
        throw new Error(data.error);
      }
    } catch (err) {
      if (!err.message.includes("Failed to create")) {
        setError("Failed to create supplier");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/suppliers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ supplier_id: id }),
      });

      if (res.ok) {
        fetchSuppliers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete supplier");
      }
    } catch (err) {
      alert("Failed to delete supplier");
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier contacts</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 size-4" />
          {showCreateForm ? "Cancel" : "Add Supplier"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateForm
          title="Add New Supplier"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setShowCreateForm(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create Supplier"
        />
      )}

      <DataTable
        columns={COLUMNS}
        data={suppliers}
        pageSize={10}
        searchKeys={["supplier_name", "contact_person", "email"]}
        deleteIdKey="supplier_id"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No suppliers found"
      />
    </div>
  );
}
