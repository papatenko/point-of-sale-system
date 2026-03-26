import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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

import { GENDER_OPTIONS } from "@/data/gender";
import { ETHNICITY_OPTIONS } from "@/data/ethnicity";

export const Route = createFileRoute("/customer/create_customer")({
  component: CustomerCreationComponent,
});

function CustomerCreationComponent() {

  const [phoneError, setPhoneError] = useState(""); 
  const [nameError, setNameError] = useState(""); 
  const [LnameError, setLNameError] = useState(""); 
  const navigate = useNavigate();
  const [existingEmails, setExistingEmails] = useState([]);
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

  useEffect(() => {
  async function fetchExistingEmails() {
    try {
      const res = await fetch("http://localhost:3000/api/customers");
      const data = await res.json();
      // data sería un array de customers, extraemos solo emails
      const emails = data.map(c => c.email);
      setExistingEmails(emails);
    } catch (err) {
      console.error("Error fetching existing emails", err);
    }
  }

  fetchExistingEmails();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

      if (name === "phone_number") {
        //todo lo q no sea numero no se escribe
        const numericValue = value.replace(/\D/g, "");
      // Detectar si hay algo que no sea número
        if (value !== numericValue) {
          setPhoneError("Only numbers are allowed");
        }  else {
          setPhoneError("");
      }
        setForm({ ...form, [name]: numericValue });
        return;
      }


      if (name === "first_name") {
        const nameValue = value.replace(/[^a-zA-Z]/g, "");
        if (value !== nameValue) {
          setNameError("Only letters are allowed");
        } else {
          setNameError("");
        }
        setForm({ ...form, [name]: nameValue });
        return;
      }

      if (name === "last_name") {
        const lNameValue = value.replace(/[^a-zA-Z]/g, "");
        if (value !== lNameValue) {
          setLNameError("Only letters are allowed");
        } else {
          setLNameError("");
        }
        setForm({ ...form, [name]: lNameValue });
        return;
      }

     

    setForm({ ...form, [e.target.name]: value });
  };

  const handleSelectChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

     if (existingEmails.includes(form.email)) {
      alert("Customer with this email already exists!");
      setIsSubmitting(false);
      return;
  }


    if (
      form.phone_number &&
      (form.phone_number.length < 10 || form.phone_number.length > 11)
    ) {
      alert("Phone number must be 10 or 11 digits");
      setIsSubmitting(false);
      return;
    }

    if (
      form.password &&
      (form.password.length < 8 )
    ) {
      alert("password must be at least 8 characters");
      setIsSubmitting(false);
      return;
    }

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
      navigate({ to: "/order" });
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
                        <SelectItem key={g.value} value={g.value}>
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
                        <SelectItem key={e.value} value={e.value}>
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