import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { EditDialog } from "@/components/common/edit-dialog";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";
import { PHONE_MAX_LENGTH, PHONE_PLACEHOLDER, formatPhoneNumber, normalizePhoneNumber } from "@/utils/constraints";

export const Route = createFileRoute("/employee/database/food-trucks")({
  component: FoodTrucksDatabaseComponent,
});



const COLUMNS = [
  { key: "license_plate", label: "License Plate" },
  { key: "truck_name", label: "Truck Name" },
  { key: "current_location", label: "Location" },
  { key: "phone_number", label: "Phone" },
  {
    key: "is_active",
    label: "Status",
    format: (v) => Number(v) === 1 ? "Active" : "Inactive"
  },
  {
    key: "accepts_online_orders",
    label: "Online Orders",
    format: (v) => (v ? "Yes" : "No"),
  },
  { key: "operating_hours_start", label: "Opens" },
  { key: "operating_hours_end", label: "Closes" },
];

const CREATE_FIELDS = [
  {
    name: "license_plate",
    label: "License Plate",
    type: "text",
    required: true,
  },
  { name: "truck_name", label: "Truck Name", type: "text", required: true },
  { name: "current_location", label: "Location", type: "text" },
  { name: "phone_number", label: "Phone", type: "tel", placeholder: PHONE_PLACEHOLDER, maxLength: PHONE_MAX_LENGTH, formatOnChange: true, formatValue: formatPhoneNumber },
  { name: "operating_hours_start", label: "Opens (e.g., 09:00)", type: "text" },
  { name: "operating_hours_end", label: "Closes (e.g., 22:00)", type: "text" },
  {
  name: "is_active",
  label: "Status",
  type: "select",
  options: [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ],
},
];

function FoodTrucksDatabaseComponent() {

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const { alertConfig, showAlert, hideAlert, AlertPopupComponent } =
    useAlertPopup();

  const fetchTrucks = async () => {

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/trucks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      console.log("📦 FULL DATA:", data);
      setTrucks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch trucks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/trucks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          license_plate: formData.license_plate,
          truck_name: formData.truck_name,
          current_location: formData.current_location || null,
          phone_number: normalizePhoneNumber(formData.phone_number),
          accepts_online_orders: true,
          operating_hours_start: formData.operating_hours_start || null,
          operating_hours_end: formData.operating_hours_end || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchTrucks();
      } else {
        setError(data.error || "Failed to create truck");
        return false;
      }
    } catch {
      setError("Failed to create truck");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (truck) => {
    setSelectedTruck(truck);
    setEditOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/trucks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          license_plate: selectedTruck.license_plate,
          truck_name: formData.truck_name,
          current_location: formData.current_location || null,
          phone_number: normalizePhoneNumber(formData.phone_number),
          accepts_online_orders: true,
          operating_hours_start: formData.operating_hours_start || null,
          operating_hours_end: formData.operating_hours_end || null,

          is_active:
          formData.is_active === "true" || formData.is_active === true,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchTrucks();
        return true;
      } else {
        showAlert({
          title: "Error Updating Truck",
          description: data.error || "Failed to update truck",
          variant: "error",
        });
        return false;
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to update truck",
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
          <h1 className="text-2xl font-bold">Food Trucks</h1>
          <p className="text-muted-foreground">Manage your food truck fleet</p>
        </div>
        <AddDialog
          triggerLabel="Add Truck"
          title="Add New Truck"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={trucks}
        pageSize={10}
        searchKeys={["truck_name", "license_plate", "current_location"]}
        onEdit={openEditDialog}
        loading={loading}
        emptyMessage="No trucks found"
      />

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        title="Edit Truck"
        fields={CREATE_FIELDS}
        initialData={selectedTruck || {}}
        readOnlyFields={["license_plate"]}
        onSubmit={handleEditSubmit}
        onSuccess={() => {}}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  );
}
