import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/database/data-table";
import { CreateForm } from "@/components/database/create-form";
import { Plus } from "lucide-react";
import { GENDER_OPTIONS } from "@/data/gender";
import { ETHNICITY_OPTIONS } from "@/data/ethnicity";

export const Route = createFileRoute("/customer/database/customer")({
  component: CustomersDatabaseComponent,
});

const COLUMNS = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "default_address", label: "Default Address" },
];

const CREATE_FIELDS = [
  { name: "email", label: "Email", type: "email", required: true },
  { name: "first_name", label: "First Name", type: "text", required: true },
  { name: "last_name", label: "Last Name", type: "text", required: true },
  { name: "password", label: "Password", type: "password", required: true },
  { name: "phone_number", label: "Phone", type: "text" },
  { name: "default_address", label: "Default Address", type: "text" },
  { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
  { name: "ethnicity", label: "Ethnicity", type: "select", options: ETHNICITY_OPTIONS },
];

function CustomersDatabaseComponent() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/customers", {
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

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const userResponse = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: formData.password,
          phone_number: formData.phone_number || null,
          gender: formData.gender ? parseInt(formData.gender) : null,
          ethnicity: formData.ethnicity ? parseInt(formData.ethnicity) : null,
          user_type: "customer",
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        setError(userData.error || "Error creating user");
        throw new Error(userData.error);
      }

      const customerResponse = await fetch("http://localhost:3000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          default_address: formData.default_address || null,
        }),
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        setError(customerData.error || "Error creating customer");
        throw new Error(customerData.error);
      }

      setShowCreateForm(false);
      fetchCustomers();
    } catch (err) {
      if (!err.message.includes("Error creating")) {
        setError("Failed to create customer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (email) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3000/api/customers", {
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
          <p className="text-muted-foreground">Manage your customer records</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add Customer"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateForm
          title="Add New Customer"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setShowCreateForm(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create Customer"
        />
      )}

      <DataTable
        columns={COLUMNS}
        data={customers}
        searchKeys={["first_name", "last_name", "email", "default_address"]}
        deleteIdKey="email"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No customers found"
      />
    </div>
  );
}