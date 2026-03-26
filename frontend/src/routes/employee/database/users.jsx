import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/database/data-table";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/employee/database/users")({
  component: UsersDatabaseComponent,
});

const COLUMNS = [
  { key: "email", label: "Email" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "password", label: "Password" },
  { key: "phone_number", label: "Phone" },
  { key: "user_type", label: "Type" },
  { key: "gender_name", label: "Gender" },
  { key: "race_name", label: "Ethnicity" },
];

function UsersDatabaseComponent() {
  const [users, setUsers] = useState([]);
  const [genders, setGenders] = useState([]);
  const [ethnicities, setEthnicities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    phone_number: "",
    gender: "",
    ethnicity: "",
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenders = async () => {
    try {
      const res = await fetch("/api/users/genders");
      const data = await res.json();
      setGenders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch genders:", err);
    }
  };

  const fetchEthnicities = async () => {
    try {
      const res = await fetch("/api/users/ethnicities");
      const data = await res.json();
      setEthnicities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch ethnicities:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGenders();
    fetchEthnicities();
  }, []);

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: user.password || "",
      phone_number: user.phone_number || "",
      gender: user.gender || "",
      ethnicity: user.ethnicity || "",
    });
  };

  const handleCancel = () => {
    setEditUser(null);
    setForm({
      first_name: "",
      last_name: "",
      password: "",
      phone_number: "",
      gender: "",
      ethnicity: "",
    });
    setError(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editUser.email,
          first_name: form.first_name,
          last_name: form.last_name,
          password: form.password || null,
          phone_number: form.phone_number || null,
          gender: form.gender || null,
          ethnicity: form.ethnicity || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        handleCancel();
        fetchUsers();
      } else {
        setError(data.error || "Failed to update user");
      }
    } catch (err) {
      setError("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (email) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const enrichedUsers = users.map((user) => ({
    ...user,
    race_name: user.race_name || user.ethnicity || "-",
  }));

  const enrichedColumns = [
    ...COLUMNS.slice(0, 6),
    { key: "race_name", label: "Ethnicity" },
    ...COLUMNS.slice(8),
  ];

  const genderOptions = genders.map((g) => ({
    value: String(g.gender_id),
    label: g.gender,
  }));

  const ethnicityOptions = ethnicities.map((e) => ({
    value: String(e.race_id),
    label: e.race,
  }));

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
      </div>

      {editUser && (
        <Card>
          <CardHeader>
            <CardTitle>Edit User: {editUser.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="first_name">First Name</Label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="last_name">Last Name</Label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label htmlFor="phone_number">Phone</Label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="text"
                    value={form.phone_number}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => handleSelectChange("gender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label>Ethnicity</Label>
                  <Select
                    value={form.ethnicity}
                    onValueChange={(v) => handleSelectChange("ethnicity", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ethnicityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={enrichedColumns}
        data={enrichedUsers}
        limit={5}
        searchKeys={[
          "first_name",
          "last_name",
          "password",
          "email",
          "user_type",
          "gender_name",
          "ethnicity_name",
        ]}
        deleteIdKey="email"
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="No users found"
        onEdit={handleEdit}
      />
    </div>
  );
}
