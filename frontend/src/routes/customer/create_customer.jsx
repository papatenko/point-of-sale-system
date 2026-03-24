import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/customer/create_customer")({
  component: CustomerCreationComponent,
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

function CustomerCreationComponent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone_number: "",
    default_address: "",
    gender: "1",
    ethnicity: "1",
  });

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
      const userResponse = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          password: form.password,
          phone_number: form.phone_number || null,
          gender: parseInt(form.gender),
          ethnicity: parseInt(form.ethnicity),
          user_type: "customer",
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        alert(userData.error || "Error creating user");
        throw new Error(userData.error);
      }

      const customerResponse = await fetch("http://localhost:3000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.email,
          default_address: form.default_address || null,
        }),
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        alert(customerData.error || "Error creating customer");
        throw new Error(customerData.error);
      }

      alert("Customer created successfully!");
      navigate({ to: "/employee" });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create customer. Check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full p-4">
      <Card className="max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Customer</CardTitle>
          <CardDescription>
            Add a new customer to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              {/* Email - full width */}
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="customer@example.com"
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
                <Label htmlFor="password">Customer Password</Label>
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

              {/* Default Address */}
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="default_address">Default Address</Label>
                <Input
                  id="default_address"
                  name="default_address"
                  type="text"
                  placeholder="123 Main St, City, State"
                  value={form.default_address}
                  onChange={handleChange}
                  autoComplete="street-address"
                />
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
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6"
            >
              {isSubmitting ? "Creating..." : "Create Customer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}