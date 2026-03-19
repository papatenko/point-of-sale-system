import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/database/data-table";
import { CreateForm } from "@/components/database/create-form";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/employee/database/food-trucks")({
  component: FoodTrucksDatabaseComponent,
});

const COLUMNS = [
  { key: "license_plate", label: "License Plate" },
  { key: "truck_name", label: "Truck Name" },
  { key: "current_location", label: "Location" },
  { key: "phone_number", label: "Phone" },
  { key: "accepts_online_orders", label: "Online Orders", format: (v) => v ? "Yes" : "No" },
  { key: "operating_hours_start", label: "Opens" },
  { key: "operating_hours_end", label: "Closes" },
];

const CREATE_FIELDS = [
  { name: "license_plate", label: "License Plate", type: "text", required: true },
  { name: "truck_name", label: "Truck Name", type: "text", required: true },
  { name: "current_location", label: "Location", type: "text" },
  { name: "phone_number", label: "Phone", type: "text" },
  { name: "operating_hours_start", label: "Opens (e.g., 09:00)", type: "text" },
  { name: "operating_hours_end", label: "Closes (e.g., 22:00)", type: "text" },
];

function FoodTrucksDatabaseComponent() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrucks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/trucks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
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
      const res = await fetch("http://localhost:3000/api/trucks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          license_plate: formData.license_plate,
          truck_name: formData.truck_name,
          current_location: formData.current_location || null,
          phone_number: formData.phone_number || null,
          accepts_online_orders: true,
          operating_hours_start: formData.operating_hours_start || null,
          operating_hours_end: formData.operating_hours_end || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        fetchTrucks();
      } else {
        setError(data.error || "Failed to create truck");
        throw new Error(data.error);
      }
    } catch (err) {
      if (!err.message.includes("Failed to create")) {
        setError("Failed to create truck");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (licensePlate) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3000/api/trucks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ license_plate: licensePlate }),
      });

      if (res.ok) {
        fetchTrucks();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete truck");
      }
    } catch (err) {
      alert("Failed to delete truck");
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Food Trucks</h1>
          <p className="text-muted-foreground">Manage your food truck fleet</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add Truck"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateForm
          title="Add New Truck"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setShowCreateForm(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create Truck"
        />
      )}

      <DataTable
        columns={COLUMNS}
        data={trucks}
        searchKeys={["truck_name", "license_plate", "current_location"]}
        deleteIdKey="license_plate"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No trucks found"
      />
    </div>
  );
}
