import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { EditDialog } from "@/components/common/edit-dialog";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";
import { PHONE_MAX_LENGTH, PHONE_PLACEHOLDER, formatPhoneNumber, normalizePhoneNumber } from "@/utils/constraints";

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
  { name: "phone_number", label: "Phone", type: "tel", placeholder: PHONE_PLACEHOLDER, maxLength: PHONE_MAX_LENGTH, formatOnChange: true, formatValue: formatPhoneNumber },
  { name: "address", label: "Address", type: "text" },
];

function SuppliersDatabaseComponent() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const { alertConfig, showAlert, hideAlert, AlertPopupComponent } =
    useAlertPopup();

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
          phone_number: normalizePhoneNumber(formData.phone_number),
          address: formData.address || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchSuppliers();
      } else {
        setError(data.error || "Failed to create supplier");
        return false;
      }
    } catch {
      setError("Failed to create supplier");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setEditOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/suppliers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplier_id: selectedSupplier.supplier_id,
          supplier_name: formData.supplier_name,
          contact_person: formData.contact_person || null,
          email: formData.email || null,
          phone_number: normalizePhoneNumber(formData.phone_number),
          address: formData.address || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchSuppliers();
        return true;
      } else {
        showAlert({
          title: "Error Updating Supplier",
          description: data.error || "Failed to update supplier",
          variant: "error",
        });
        return false;
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to update supplier",
        variant: "error",
      });
      return false;
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
        showAlert({
          title: "Error Deleting Supplier",
          description: data.error || "Failed to delete supplier",
          variant: "error",
        });
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "error",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <AlertPopupComponent />
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier contacts</p>
        </div>
        <AddDialog
          triggerLabel="Add Supplier"
          title="Add New Supplier"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={suppliers}
        pageSize={10}
        searchKeys={["supplier_name", "contact_person", "email"]}
        deleteIdKey="supplier_id"
        onDelete={handleDelete}
        onEdit={openEditDialog}
        loading={loading}
        emptyMessage="No suppliers found"
      />

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        title="Edit Supplier"
        fields={CREATE_FIELDS}
        initialData={selectedSupplier || {}}
        onSubmit={handleEditSubmit}
        onSuccess={() => {}}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  );
}
