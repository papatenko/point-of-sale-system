import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { TruckFilter } from "@/components/common/truck-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENDER_OPTIONS } from "@/constants/gender";
import { ETHNICITY_OPTIONS } from "@/constants/ethnicity";
import { Pencil, Users, UserCircle, AlertTriangle } from "lucide-react";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";

export const Route = createFileRoute("/employee/database/users")({
  component: UsersDatabaseComponent,
});

const ROLE_OPTIONS = [
  { value: "cashier", label: "Cashier" },
  { value: "cook", label: "Cook" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const EMPLOYEE_COLUMNS = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "phone_number", label: "Phone" },
  { key: "role", label: "Role" },
  { key: "license_plate", label: "Truck" },
  { key: "gender_name", label: "Gender" },
  { key: "ethnicity_name", label: "Ethnicity" },
];

const CUSTOMER_COLUMNS = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "default_address", label: "Default Address" },
  { key: "phone_number", label: "Phone" },
  { key: "gender_name", label: "Gender" },
  { key: "ethnicity_name", label: "Ethnicity" },
];

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function UsersDatabaseComponent() {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteEmployeeOpen, setDeleteEmployeeOpen] = useState(false);
  const [deleteEmployeeEmail, setDeleteEmployeeEmail] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { alertConfig, showAlert, hideAlert, AlertPopupComponent } =
    useAlertPopup();

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees", { headers: authHeaders() });
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers", { headers: authHeaders() });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrucks = useCallback(async () => {
    try {
      const res = await fetch("/api/trucks");
      const data = await res.json();
      setTrucks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch trucks:", err);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchCustomers();
    fetchTrucks();
  }, [fetchEmployees, fetchCustomers, fetchTrucks]);

  const truckOptions = useMemo(() => {
    return trucks.map((t) => ({
      value: t.license_plate,
      label: `${t.truck_name} — ${t.current_location ?? t.license_plate}`,
    }));
  }, [trucks]);

  const filteredEmployees = useMemo(() => {
    if (!selectedTruck) return employees;
    return employees.filter((e) => e.license_plate === selectedTruck);
  }, [employees, selectedTruck]);

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
          license_plate:
            formData.license_plate || trucks[0]?.license_plate || "ABC-123",
          role: formData.role,
          hire_date: new Date().toISOString().split("T")[0],
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

  const confirmDeleteEmployee = (email) => {
    setDeleteEmployeeEmail(email);
    setDeleteEmployeeOpen(true);
  };

  const handleDeleteEmployee = async () => {
    const res = await fetch("/api/employees", {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ email: deleteEmployeeEmail }),
    });

    if (res.ok) {
      setDeleteEmployeeOpen(false);
      setDeleteEmployeeEmail(null);
      fetchEmployees();
    } else {
      const data = await res.json();
      showAlert({
        title: "Error Deleting Employee",
        description: data.error || "Failed to delete employee",
        variant: "error",
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    const res = await fetch("/api/customers", {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ email: selectedCustomer.email }),
    });

    if (res.ok) {
      setDeleteCustomerOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } else {
      const data = await res.json();
      showAlert({
        title: "Error Deleting Customer",
        description: data.error || "Failed to delete customer",
        variant: "error",
      });
    }
  };

  const openEditDialog = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      email: employee.email,
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      phone_number: employee.phone_number || "",
      role: employee.role || "",
      license_plate: employee.license_plate || "",
      gender: employee.gender ? String(employee.gender) : "",
      ethnicity: employee.ethnicity ? String(employee.ethnicity) : "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setIsSubmitting(true);
    setError(null);

    try {
      const userRes = await fetch("/api/users", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          email: fd.get("email"),
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          phone_number: fd.get("phone_number") || null,
          gender: fd.get("gender") ? parseInt(fd.get("gender")) : null,
          ethnicity: fd.get("ethnicity") ? parseInt(fd.get("ethnicity")) : null,
        }),
      });

      const empRes = await fetch("/api/employees", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          email: fd.get("email"),
          role: fd.get("role"),
          license_plate: fd.get("license_plate"),
        }),
      });

      if (userRes.ok && empRes.ok) {
        setEditOpen(false);
        fetchEmployees();
      } else {
        const ud = await userRes.json();
        const ed = await empRes.json();
        showAlert({
          title: "Error Updating Employee",
          description: ud.error || ed.error || "Failed to update employee",
          variant: "error",
        });
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to update employee",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CREATE_FIELDS = [
    { name: "email", label: "Email", type: "email", required: true },
    { name: "first_name", label: "First Name", type: "text", required: true },
    { name: "last_name", label: "Last Name", type: "text", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "phone_number", label: "Phone", type: "text" },
    {
      name: "role",
      label: "Role",
      type: "select",
      options: ROLE_OPTIONS,
      required: true,
    },
    {
      name: "license_plate",
      label: "Truck",
      type: "select",
      options: truckOptions,
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: GENDER_OPTIONS,
    },
    {
      name: "ethnicity",
      label: "Ethnicity",
      type: "select",
      options: ETHNICITY_OPTIONS,
    },
  ];

  return (
    <div className="p-6 space-y-6 w-full">
      <AlertPopupComponent />
      <AlertPopup
        open={deleteEmployeeOpen}
        onOpenChange={setDeleteEmployeeOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteEmployeeEmail}"? This will also remove the user account.`}
        variant="destructive"
        onConfirm={handleDeleteEmployee}
        confirmLabel="Delete"
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Email</Label>
                  <Input
                    value={editForm.email}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <input type="hidden" name="email" value={editForm.email} />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Role</Label>
                  <Select
                    name="role"
                    value={editForm.role}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>First Name</Label>
                  <Input
                    name="first_name"
                    defaultValue={editForm.first_name}
                    required
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Last Name</Label>
                  <Input
                    name="last_name"
                    defaultValue={editForm.last_name}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Phone</Label>
                  <Input
                    name="phone_number"
                    defaultValue={editForm.phone_number}
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Truck</Label>
                  <Select
                    name="license_plate"
                    value={editForm.license_plate}
                    onValueChange={(v) =>
                      setEditForm((p) => ({ ...p, license_plate: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {truckOptions.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Gender</Label>
                  <Select
                    name="gender"
                    value={editForm.gender}
                    onValueChange={(v) =>
                      setEditForm((p) => ({ ...p, gender: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Ethnicity</Label>
                  <Select
                    name="ethnicity"
                    value={editForm.ethnicity}
                    onValueChange={(v) =>
                      setEditForm((p) => ({ ...p, ethnicity: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage employees and customer accounts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="employees" className="gap-1.5">
              <Users className="size-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-1.5">
              <UserCircle className="size-4" />
              Customers
            </TabsTrigger>
          </TabsList>

          {activeTab === "employees" && (
            <AddDialog
              triggerLabel="Add Employee"
              title="Add New Employee"
              fields={CREATE_FIELDS}
              onSubmit={handleCreateSubmit}
              isSubmitting={isSubmitting}
              error={error}
              submitLabel="Create"
            />
          )}
        </div>

        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <TruckFilter
              trucks={trucks}
              selectedTruck={selectedTruck}
              onSelect={setSelectedTruck}
            />
            <span className="text-sm text-muted-foreground">
              {filteredEmployees.length} of {employees.length} employees
            </span>
          </div>

          <DataTable
            columns={EMPLOYEE_COLUMNS}
            data={filteredEmployees}
            pageSize={10}
            searchKeys={[
              "first_name",
              "last_name",
              "email",
              "phone_number",
              "role",
              "gender_name",
              "ethnicity_name",
            ]}
            deleteIdKey="email"
            onDelete={confirmDeleteEmployee}
            onEdit={openEditDialog}
            loading={loading}
            emptyMessage="No employees found"
          />
        </TabsContent>

        <TabsContent value="customers" className="mt-4 space-y-4">
          <DataTable
            columns={CUSTOMER_COLUMNS}
            data={customers}
            pageSize={10}
            searchKeys={[
              "email",
              "first_name",
              "last_name",
              "default_address",
              "phone_number",
              "gender_name",
              "ethnicity_name",
            ]}
            deleteIdKey="email"
            onDelete={(email) => {
              const c = customers.find((x) => x.email === email);
              setSelectedCustomer(c || null);
              setDeleteCustomerOpen(true);
            }}
            loading={loading}
            emptyMessage="No customers found"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={deleteCustomerOpen} onOpenChange={setDeleteCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Delete Customer
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              Are you sure you want to delete customer{" "}
              <strong>"{selectedCustomer?.email}"</strong>? This will also
              remove their user account.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCustomerOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
