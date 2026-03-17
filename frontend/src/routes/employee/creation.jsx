import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute('/employee/creation')({
  component: CreationComponent,
})

function CreationComponent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    adminPassword: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone_number: "",
    role: "cashier",
    gender: 1,
    ethnicity: 1,
    license_plate: "",
    hire_date: "",
    hourly_rate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:3000/api/employee/creation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminPassword: form.adminPassword,
          employeeData: form,
        }),
      });

      // Verificar si la respuesta es JSON antes de parsearla
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
        // Si no es JSON, leer como texto
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

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white shadow-md rounded w-96 space-y-4"
      >
        <h2 className="text-xl font-bold mb-4">Create Employee</h2>

        {/* Admin Password */}
        <div>
          <label htmlFor="adminPassword" className="block mb-1 text-sm font-medium">
            Admin Password
          </label>
          <input
            id="adminPassword"
            name="adminPassword"
            type="password"
            placeholder="Admin Password"
            value={form.adminPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off" // No autocomplete for admin password
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="email"
            required
          />
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block mb-1 text-sm font-medium">
            First Name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="given-name"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block mb-1 text-sm font-medium">
            Last Name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="family-name"
            required
          />
        </div>

        {/* Employee Password */}
        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium">
            Employee Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Employee Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone_number" className="block mb-1 text-sm font-medium">
            Phone Number
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            placeholder="Phone Number"
            value={form.phone_number}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="tel"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block mb-1 text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off"
          >
            <option value="cashier">Cashier</option>
            <option value="cook">Cook</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block mb-1 text-sm font-medium">
            Gender ID
          </label>
          <input
            id="gender"
            name="gender"
            type="number"
            placeholder="Gender ID"
            value={form.gender}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off"
          />
        </div>

        {/* Ethnicity */}
        <div>
          <label htmlFor="ethnicity" className="block mb-1 text-sm font-medium">
            Ethnicity ID
          </label>
          <input
            id="ethnicity"
            name="ethnicity"
            type="number"
            placeholder="Ethnicity ID"
            value={form.ethnicity}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off"
          />
        </div>

        {/* License Plate */}
        <div>
          <label htmlFor="license_plate" className="block mb-1 text-sm font-medium">
            Truck License Plate
          </label>
          <input
            id="license_plate"
            name="license_plate"
            type="text"
            placeholder="Truck License Plate"
            value={form.license_plate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off"
          />
        </div>

        {/* Hire Date */}
        <div>
          <label htmlFor="hire_date" className="block mb-1 text-sm font-medium">
            Hire Date
          </label>
          <input
            id="hire_date"
            name="hire_date"
            type="date"
            placeholder="Hire Date"
            value={form.hire_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off"
          />
        </div>

        {/* Hourly Rate */}
        <div>
          <label htmlFor="hourly_rate" className="block mb-1 text-sm font-medium">
            Hourly Rate
          </label>
          <input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            step="0.01"
            placeholder="Hourly Rate"
            value={form.hourly_rate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4 disabled:bg-blue-300"
        >
          {isSubmitting ? "Creating..." : "Create Employee"}
        </button>
      </form>
    </div>
  );
}