import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { GENDER_OPTIONS } from "@/data/gender";
import { ETHNICITY_OPTIONS } from "@/data/ethnicity";

export const Route = createFileRoute("/employee/database/employees")({
  component: EmployeesDatabaseComponent,
});

const ROLE_OPTIONS = [
  { value: "cashier", label: "Cashier" },
  { value: "cook", label: "Cook" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const COLUMNS = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "role", label: "Role" },
  { key: "license_plate", label: "Truck" },
];

const CREATE_FIELDS = [
  { name: "email", label: "Email", type: "email", required: true },
  { name: "first_name", label: "First Name", type: "text", required: true },
  { name: "last_name", label: "Last Name", type: "text", required: true },
  { name: "password", label: "Password", type: "password", required: true },
  { name: "phone_number", label: "Phone", type: "text" },
  { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS, required: true },
  { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
  { name: "ethnicity", label: "Ethnicity", type: "select", options: ETHNICITY_OPTIONS },
];

function EmployeesDatabaseComponent() {
  const [employees, setEmployees] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const res = await fetch("/api/trucks");
      const data = await res.json();
      setTrucks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch trucks:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTrucks();
  }, []);

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const userResponse = await fetch("/api/users", {
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
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        setError(userData.error || "Error creating user");
        return false;
      }

      const employeeResponse = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          license_plate: trucks[0]?.license_plate || "ABC-123",
          role: formData.role,
          hire_date: new Date().toISOString().split("T")[0],
          hourly_rate: null,
        }),
      });

      const employeeData = await employeeResponse.json();
      if (!employeeResponse.ok) {
        setError(employeeData.error || "Error creating employee");
        return false;
      }

      fetchEmployees();
    } catch {
      setError("Failed to create employee");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (email) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        fetchEmployees();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete employee");
      }
    } catch {
      alert("Failed to delete employee");
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your employee records</p>
        </div>
        <AddDialog
          triggerLabel="Add Employee"
          title="Add New Employee"
          fields={CREATE_FIELDS}
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Create"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={employees}
        pageSize={10}
        searchKeys={["first_name", "last_name", "email", "role"]}
        deleteIdKey="email"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No employees found"
      />
    </div>
  );
}
