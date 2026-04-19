import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/database/data-table";
import { AddDialog } from "@/components/database/add-dialog";
import { EditDialog } from "@/components/common/edit-dialog";
import { TruckFilter } from "@/components/common/truck-filter";
import { Button } from "@/components/ui/button";
import { GENDER_OPTIONS } from "@/constants/gender";
import { ETHNICITY_OPTIONS } from "@/constants/ethnicity";
import { Users, UserCircle } from "lucide-react";
import { AlertPopup, useAlertPopup } from "@/components/common/alert-popup";
import { StatusFilter } from "@/components/database/status-filter";
import { createStatusColumn } from "@/components/database/status-column.jsx";
import { createStatusField } from "@/components/database/status-field";
import {
  PHONE_MIN_LENGTH,
  PHONE_MAX_LENGTH,
  PHONE_PLACEHOLDER,
  formatPhoneNumber,
  normalizePhoneNumber,
  PASSWORD_MIN_LENGTH,
  getPasswordError,
} from "@/utils/constraints";

export const Route = createFileRoute("/employee/database/users")({
  component: UsersDatabaseComponent,
});

const ROLE_OPTIONS = [
  { value: "Cashier", label: "Cashier" },
  { value: "Cook", label: "Cook" },
  { value: "Manager", label: "Manager" },
  { value: "Admin", label: "Admin" },
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
  createStatusColumn(),
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [deleteCustomerEmail, setDeleteCustomerEmail] = useState(null);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [reactivateCustomerOpen, setReactivateCustomerOpen] = useState(false);
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

  const fetchCustomers = useCallback(async (status = "active") => {
    try {
      const res = await fetch(`/api/customers?status=${status}`, {
        headers: authHeaders(),
      });
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
    fetchCustomers(customerStatusFilter);
    fetchTrucks();
  }, [fetchEmployees, fetchCustomers, fetchTrucks, customerStatusFilter]);

  const handleCustomerStatusChange = (status) => {
    setCustomerStatusFilter(status);
    fetchCustomers(status);
  };

  const handleDeleteCustomer = async (customer) => {
    setDeleteCustomerEmail(customer.email);
    setDeleteCustomerOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteCustomerEmail) return;
    try {
      const res = await fetch(`/api/customers/${deleteCustomerEmail}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        showAlert({
          title: "Customer Deleted",
          description: "The customer account has been removed.",
          variant: "success",
        });
        fetchCustomers(customerStatusFilter);
      } else {
        const data = await res.json();
        showAlert({
          title: "Error",
          description: data.error || "Failed to delete customer",
          variant: "error",
        });
      }
    } catch (err) {
      showAlert({
        title: "Error",
        description: "Failed to delete customer",
        variant: "error",
      });
    }
    setDeleteCustomerOpen(false);
    setDeleteCustomerEmail(null);
  };

  const handleReactivateCustomer = (customer) => {
    setDeleteCustomerEmail(customer.email);
    setReactivateCustomerOpen(true);
  };

  const confirmReactivateCustomer = async () => {
    if (!deleteCustomerEmail) return;
    try {
      const res = await fetch(
        `/api/customers/${deleteCustomerEmail}/reactivate`,
        {
          method: "PUT",
          headers: authHeaders(),
        },
      );
      if (res.ok) {
        showAlert({
          title: "Customer Reactivated",
          description: "The customer account has been restored.",
          variant: "success",
        });
        setCustomerStatusFilter("active");
        fetchCustomers("active");
      } else {
        const data = await res.json();
        showAlert({
          title: "Error",
          description: data.error || "Failed to reactivate customer",
          variant: "error",
        });
      }
    } catch (err) {
      showAlert({
        title: "Error",
        description: "Failed to reactivate customer",
        variant: "error",
      });
    }
    setReactivateCustomerOpen(false);
    setDeleteCustomerEmail(null);
  };

  const truckOptions = useMemo(() => {
    return trucks.map((t) => ({
      value: t.license_plate,
      label: `${t.truck_name} — ${t.current_location ?? t.license_plate}`,
    }));
  }, [trucks]);

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (selectedTruck) {
      filtered = filtered.filter((e) => e.license_plate === selectedTruck);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((e) => e.is_active === 1);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((e) => e.is_active === 0);
    }

    return filtered;
  }, [employees, selectedTruck, statusFilter]);

  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    const pwError = getPasswordError(formData.password);
    if (pwError) {
      setError(pwError);
      setIsSubmitting(false);
      return false;
    }

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
          phone_number: normalizePhoneNumber(formData.phone_number),
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
      is_active: employee.is_active ? "1" : "0",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const userRes = await fetch("/api/users", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          email: selectedEmployee.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: normalizePhoneNumber(formData.phone_number),
          gender: formData.gender ? parseInt(formData.gender) : null,
          ethnicity: formData.ethnicity ? parseInt(formData.ethnicity) : null,
        }),
      });

      const empRes = await fetch("/api/employees", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          email: selectedEmployee.email,
          role: formData.role,
          license_plate: formData.license_plate,
          is_active: formData.is_active,
        }),
      });

      if (userRes.ok && empRes.ok) {
        fetchEmployees();
        return true;
      } else {
        const ud = await userRes.json();
        const ed = await empRes.json();
        showAlert({
          title: "Error Updating Employee",
          description: ud.error || ed.error || "Failed to update employee",
          variant: "error",
        });
        return false;
      }
    } catch {
      showAlert({
        title: "Error",
        description: "Failed to update employee",
        variant: "error",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const EDIT_FIELDS = [
    { name: "email", label: "Email", type: "email" },
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      required: true,
      sanitizeOnChange: true,
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      required: true,
      sanitizeOnChange: true,
    },
    {
      name: "phone_number",
      label: "Phone",
      type: "tel",
      placeholder: PHONE_PLACEHOLDER,
      maxLength: PHONE_MAX_LENGTH,
      formatOnChange: true,
      formatValue: formatPhoneNumber,
    },
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
    createStatusField({ name: "is_active", label: "Employment" }),
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

  const CREATE_FIELDS = [
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      required: true,
      sanitizeOnChange: true,
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      required: true,
      sanitizeOnChange: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      minLength: PASSWORD_MIN_LENGTH,
    },
    {
      name: "phone_number",
      label: "Phone",
      type: "tel",
      placeholder: PHONE_PLACEHOLDER,
      maxLength: PHONE_MAX_LENGTH,
      formatOnChange: true,
      formatValue: formatPhoneNumber,
    },
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
      {/* <AlertPopup
        open={deleteEmployeeOpen}
        onOpenChange={setDeleteEmployeeOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteEmployeeEmail}"? This will also remove the user account.`}
        variant="destructive"
        onConfirm={handleDeleteEmployee}
        confirmLabel="Delete"
      /> */}

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        title="Edit Employee"
        fields={EDIT_FIELDS}
        initialData={selectedEmployee || {}}
        readOnlyFields={["email"]}
        onSubmit={handleEditSubmit}
        onSuccess={() => {}}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />

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
          <div className="flex items-center gap-4 flex-wrap">
            <TruckFilter
              trucks={trucks}
              selectedTruck={selectedTruck}
              onSelect={setSelectedTruck}
            />
            <StatusFilter
              statusFilter={statusFilter}
              onSelect={setStatusFilter}
              label="Employees"
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
            onEdit={openEditDialog}
            loading={loading}
            emptyMessage="No employees found"
          />
        </TabsContent>

        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <StatusFilter
              statusFilter={customerStatusFilter}
              onSelect={handleCustomerStatusChange}
              label="Customers"
            />
            <span className="text-sm text-muted-foreground">
              {customers.length} customers
            </span>
          </div>

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
            onDelete={handleDeleteCustomer}
            onReactivate={handleReactivateCustomer}
            loading={loading}
            emptyMessage="No customers found"
          />
        </TabsContent>
      </Tabs>

      <AlertPopup
        open={deleteCustomerOpen}
        onOpenChange={setDeleteCustomerOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteCustomerEmail}"? This will remove their user account access.`}
        variant="destructive"
        onConfirm={confirmDeleteCustomer}
        confirmLabel="Delete"
      />

      <AlertPopup
        open={reactivateCustomerOpen}
        onOpenChange={setReactivateCustomerOpen}
        title="Reactivate Customer"
        description={`Are you sure you want to restore "${deleteCustomerEmail}"? This will restore their user account access.`}
        variant="info"
        onConfirm={confirmReactivateCustomer}
        confirmLabel="Reactivate"
      />
    </div>
  );
}
