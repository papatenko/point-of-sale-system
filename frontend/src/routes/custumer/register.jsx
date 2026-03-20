import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute('/custumer/register')({
  component: CustomerRegister,
});

function CustomerRegister() {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    phone_number: "",
    default_address: "",
    gender: "",      // Cambiar a string vacío para manejar "prefer not to say"
    ethnicity: "",   // Cambiar a string vacío
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Preparar payload - convertir valores vacíos a null
    const payload = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      password: form.password,
      phone_number: form.phone_number || null,
      default_address: form.default_address || null,
      gender: form.gender ? parseInt(form.gender) : null,      // Si está vacío, enviar null
      ethnicity: form.ethnicity ? parseInt(form.ethnicity) : null, // Si está vacío, enviar null
    };

    try {
      const res = await fetch("/api/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage("✅ Registered successfully! You can now log in.");
        // Limpiar formulario después de registro exitoso
        setForm({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          phone_number: "",
          default_address: "",
          gender: "",
          ethnicity: "",
        });
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Connection error. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Opciones basadas en tus tablas reales
  const genderOptions = [
    { id: 1, name: "Male" },
    { id: 2, name: "Female" },
    { id: 3, name: "Non-binary" },
    { id: 4, name: "Prefer not to say" }
  ];

  const ethnicityOptions = [
    { id: 1, name: "Arab" },
    { id: 2, name: "Asian" },
    { id: 3, name: "Black or African American" },
    { id: 4, name: "Hispanic or Latino" },
    { id: 5, name: "Native American" },
    { id: 6, name: "Pacific Islander" },
    { id: 7, name: "White" },
    { id: 8, name: "Prefer not to say" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Customer Registration</h2>
        {message && (
          <div className={`mb-4 p-3 rounded text-center ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {message}
          </div>
        )}

        {/* Campos de texto */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">First Name *</label>
          <input
            name="first_name"
            type="text"
            value={form.first_name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Last Name *</label>
          <input
            name="last_name"
            type="text"
            value={form.last_name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Password *</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
            minLength="6"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Phone Number</label>
          <input
            name="phone_number"
            type="tel"
            value={form.phone_number}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Optional"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Default Address</label>
          <textarea
            name="default_address"
            value={form.default_address}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            rows="2"
            placeholder="Optional"
          />
        </div>

        {/* Gender select con opciones correctas */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Prefer not to say</option>
            {genderOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ethnicity select con opciones correctas */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Ethnicity</label>
          <select
            name="ethnicity"
            value={form.ethnicity}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Prefer not to say</option>
            {ethnicityOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 bg-red-500 text-white rounded transition ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}