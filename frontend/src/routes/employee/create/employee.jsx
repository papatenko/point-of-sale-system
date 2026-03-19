import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/employee/create/employee")({
  component: CreationComponent,
});

const GENDER_OPTIONS = [
  { id: 1, label: "Male" },
  { id: 2, label: "Female" },
  { id: 3, label: "Non-binary" },
  { id: 4, label: "Prefer not to say" },
];

const ETHNICITY_OPTIONS = [
  { id: 1, label: "Arab" },
  { id: 2, label: "Asian" },
  { id: 3, label: "Black or African American" },
  { id: 4, label: "Hispanic or Latino" },
  { id: 5, label: "Native American" },
  { id: 6, label: "Pacific Islander" },
  { id: 7, label: "White" },
  { id: 8, label: "Prefer not to say" },
];

function CreationComponent() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    adminPassword: "",
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
  });

  const licensePlates = trucks.map((t) => t.license_plate);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
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
              ...form,
              gender: parseInt(form.gender),
              ethnicity: parseInt(form.ethnicity),
            },
          }),
        },
      );

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          alert("Employee created successfully!");
          navigate({ to: "/employee" });
        } else {
          alert(data.error || "Error creating employee");
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        alert("Server error: Invalid response format");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create employee. Check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetch("/api/trucks")
      .then((r) => r.json())
      .then((data) => {
        setTrucks(data);
        if (data.length > 0)
          setForm((f) => ({ ...f, license_plate: data[0].license_plate }));
      })
      .catch(() => {})
      .finally(() => setTrucksLoading(false));
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Employee</CardTitle>
          <CardDescription>
            Add a new employee to the system. Admin password required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Admin Password - full width */}
            <div className="space-y-1">
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="Enter admin password"
                value={form.adminPassword}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Employee Details
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Email - full width */}
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="employee@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* First Name */}
                <div className="space-y-1">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={handleChange}
                    autoComplete="given-name"
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={handleChange}
                    autoComplete="family-name"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password">Employee Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Set a password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="(optional)"
                    value={form.phone_number}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => handleSelectChange("role", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="cook">Cook</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* License Plate */}
                <div className="space-y-1">
                  <Label>Truck License Plate</Label>
                  {trucksLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading trucks...
                    </p>
                  ) : trucks.length === 0 ? (
                    <p className="text-sm text-destructive">
                      No trucks available.
                    </p>
                  ) : (
                    <Combobox
                      items={licensePlates}
                      onValueChange={(v) =>
                        handleSelectChange("license_plate", v)
                      }
                    >
                      <ComboboxInput placeholder="Select a truck" />
                      <ComboboxContent>
                        <ComboboxEmpty>No trucks found.</ComboboxEmpty>
                        <ComboboxList>
                          {licensePlates.map((plate) => (
                            <ComboboxItem key={plate} value={plate}>
                              {plate}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => handleSelectChange("gender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ethnicity */}
                <div className="space-y-1">
                  <Label>Ethnicity</Label>
                  <Select
                    value={form.ethnicity}
                    onValueChange={(v) => handleSelectChange("ethnicity", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hire Date */}
                <div className="space-y-1">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    value={form.hire_date}
                    onChange={handleChange}
                  />
                </div>

                {/* Hourly Rate */}
                <div className="space-y-1">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={form.hourly_rate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2"
            >
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
