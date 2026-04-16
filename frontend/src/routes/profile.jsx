import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLogin } from "@/redux/authSlice";
import { GENDER_OPTIONS } from "@/constants/gender";
import { ETHNICITY_OPTIONS } from "@/constants/ethnicity";
import { getCurrentUser, updateProfile } from "@/services/auth";
import { PHONE_MAX_LENGTH, getPhoneError, formatPhoneNumber, normalizePhoneNumber, NAME_REGEX, sanitizeName, getPasswordError } from "@/utils/constraints";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    ethnicity: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: "/auth/login" });
      return;
    }

    getCurrentUser()
      .then((data) => {
        setFormData({
          email: data.email || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone_number: data.phone_number || "",
          gender: data.gender || "",
          ethnicity: data.ethnicity || "",
          password: "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

   const passwordError = getPasswordError(formData.password);
   if (passwordError) {
     setError(passwordError);
     setSaving(false);
     return;
   }

  const phoneError = getPhoneError(formData.phone_number);
if (phoneError) {
  setError(phoneError);
  setSaving(false);
  return;
}

    try {
      const data = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: normalizePhoneNumber(formData.phone_number),
        gender: formData.gender ? parseInt(formData.gender) : null,
        ethnicity: formData.ethnicity ? parseInt(formData.ethnicity) : null,
        password: formData.password || undefined,
      });

      setMessage(data.message || "Profile updated successfully");
      setFormData((p) => ({ ...p, password: "" }));

      if (data.token) {
        localStorage.setItem("token", data.token);
        const userData = await getCurrentUser();
        localStorage.setItem("user", JSON.stringify(userData));
        dispatch(setLogin({ token: data.token, user: userData }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-background rounded-xl shadow-sm border p-6">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Profile Settings</h1>
          <h3 className="text-1xl mb-6 text-foreground">{formData.email}</h3>
          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onBeforeInput={(e) => {
                  if (e.data && !NAME_REGEX.test(e.data)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, first_name: sanitizeName(e.target.value) }))
                }
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onBeforeInput={(e) => {
                  if (e.data && !NAME_REGEX.test(e.data)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, last_name: sanitizeName(e.target.value) }))
                }
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              {/* <input
                type="tel"
                value={formData.phone_number}
                 onBeforeInput={(e) => {
                  if (e.data && !/^[0-9]$/.test(e.data)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone_number: e.target.value }))
                }
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
                placeholder="Optional"
              /> */}
              <input
                type="tel"
                value={formData.phone_number}
                maxLength={PHONE_MAX_LENGTH}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData((p) => ({
                    ...p,
                    phone_number: formatted,
                  }));
                }}
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, gender: e.target.value }))
                }
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
              >
                <option value="">Select gender (optional)</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Ethnicity
              </label>
              <select
                value={formData.ethnicity}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, ethnicity: e.target.value }))
                }
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
              >
                <option value="">Select ethnicity (optional)</option>
                {ETHNICITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-1">
                New Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only fill this if you want to change your password
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}