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

export const Route = createFileRoute('/customer/create_customer')({
  component: CreateCustomerComponent,
})
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

function CreateCustomerComponent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone_number: "",
    gender: "1",
    ethnicity: "1",
    default_address: "",
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

  try {
    const res = await fetch("http://localhost:3000/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
        phone_number: form.phone_number || null,
        gender: parseInt(form.gender),
        ethnicity: parseInt(form.ethnicity),
        default_address: form.default_address || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error creating customer");
    }

    alert("Customer created successfully 🎉");
    navigate({ to: "/customer" });

  } catch (error) {
    console.error(error);
    alert(error.message || "Something broke 💥");
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

              {/* Email */}
              <div className="space-y-1 md:col-span-2">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                />
              </div>

              {/* Address */}
              <div className="space-y-1 md:col-span-2">
                <Label>Default Address</Label>
                <Input
                  name="default_address"
                  value={form.default_address}
                  onChange={handleChange}
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
                    <SelectValue />
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
                    <SelectValue />
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
              className="w-full mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Customer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}