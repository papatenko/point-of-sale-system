import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";

export const Route = createFileRoute("/employee/database/customers")({
  component: CustomersDatabaseComponent,
});

const COLUMNS = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "default_address", label: "Default Address" },
  { key: "phone_number", label: "Phone" },
];

function CustomersDatabaseComponent() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (email) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete customer");
      }
    } catch (err) {
      alert("Failed to delete customer");
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">View and manage customer accounts</p>
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        data={customers}
        limit={5}
        searchKeys={["email", "first_name", "last_name", "default_address", "phone_number"]}
        deleteIdKey="email"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No customers found"
      />
    </div>
  );
}
