import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/employee/database/employees")({
  component: EmployeesDatabaseComponent,
});

const GENDER_OPTIONS = [
  { value: "1", label: "Male" },
  { value: "2", label: "Female" },
  { value: "3", label: "Non-binary" },
  { value: "4", label: "Prefer not to say" },
];

const ETHNICITY_OPTIONS = [
  { value: "1", label: "Arab" },
  { value: "2", label: "Asian" },
  { value: "3", label: "Black or African American" },
  { value: "4", label: "Hispanic or Latino" },
  { value: "5", label: "Native American" },
  { value: "6", label: "Pacific Islander" },
  { value: "7", label: "White" },
  { value: "8", label: "Prefer not to say" },
];

const ROLE_OPTIONS = [
  { value: "cashier", label: "Cashier" },
  { value: "cook", label: "Cook" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

function EmployeesDatabaseComponent() {
  const [employees, setEmployees] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone_number: "",
    role: "cashier",
    gender: "1",
    ethnicity: "1",
    license_plate: "",
    hire_date: "",
    hourly_rate: "",
    adminPassword: "",
  });

  const normalizeEmployeesResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data?.error || "Failed to fetch employees");
        setEmployees([]);
        return;
      }
      setFetchError(null);
      setEmployees(normalizeEmployeesResponse(data));
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setFetchError("Failed to fetch employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/trucks");
      const data = await res.json();
      setTrucks(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setForm((f) => ({ ...f, license_plate: data[0].license_plate }));
      }
    } catch (err) {
      console.error("Failed to fetch trucks:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTrucks();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://localhost:3000/api/employee/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminPassword: form.adminPassword,
            employeeData: {
              email: form.email,
              first_name: form.first_name,
              last_name: form.last_name,
              password: form.password,
              phone_number: form.phone_number,
              role: form.role,
              gender: parseInt(form.gender),
              ethnicity: parseInt(form.ethnicity),
              license_plate: form.license_plate,
              hire_date: form.hire_date,
              hourly_rate: form.hourly_rate,
            },
          }),
        },
      );

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          setForm({
            email: "",
            first_name: "",
            last_name: "",
            password: "",
            phone_number: "",
            role: "cashier",
            gender: "1",
            ethnicity: "1",
            license_plate: trucks[0]?.license_plate || "",
            hire_date: "",
            hourly_rate: "",
            adminPassword: "",
          });
          setShowCreateForm(false);
          fetchEmployees();
        } else {
          setError(data.error || "Error creating employee");
        }
      } else {
        setError("Server error: Invalid response format");
      }
    } catch (err) {
      setError("Failed to create employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (email) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3000/api/employees", {
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
    } catch (err) {
      alert("Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter((e) =>
    `${e.first_name || ""} ${e.last_name || ""} ${e.email || ""} ${e.role || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your employee records</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add Employee"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  value={form.adminPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-6 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="phone_number">Phone</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => handleSelectChange("role", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Truck</Label>
                  <Select
                    value={form.license_plate}
                    onValueChange={(v) =>
                      handleSelectChange("license_plate", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((t) => (
                        <SelectItem
                          key={t.license_plate}
                          value={t.license_plate}
                        >
                          {t.license_plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => handleSelectChange("gender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Ethnicity</Label>
                  <Select
                    value={form.ethnicity}
                    onValueChange={(v) => handleSelectChange("ethnicity", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    value={form.hire_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Employee"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <p className="text-destructive text-sm py-4">{fetchError}</p>
          ) : loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Truck
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.email} className="border-b">
                        <td className="px-4 py-3 text-sm">{employee.email}</td>
                        <td className="px-4 py-3 text-sm">
                          {employee.first_name} {employee.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">
                          {employee.role}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {employee.license_plate}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(employee.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
