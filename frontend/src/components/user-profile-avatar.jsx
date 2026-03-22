import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, User } from "lucide-react";

const API = "http://localhost:3000";
const AVATAR_IMG = "https://github.com/shadcn.png";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Same Avatar pattern as __root.jsx (Avatar + AvatarImage + AvatarFallback).
 * Logged out: link to login. Logged in: opens profile dialog.
 */
export function UserProfileAvatar() {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [genders, setGenders] = useState([]);
  const [ethnicities, setEthnicities] = useState([]);
  const [initials, setInitials] = useState("CN");

  const [form, setForm] = useState({
    email: "",
    new_email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    ethnicity: "",
  });

  const loadOptions = useCallback(async () => {
    const [gRes, eRes] = await Promise.all([
      fetch(`${API}/api/users/genders`),
      fetch(`${API}/api/users/ethnicities`),
    ]);
    const gData = await gRes.json();
    const eData = await eRes.json();
    setGenders(Array.isArray(gData) ? gData : []);
    setEthnicities(Array.isArray(eData) ? eData : []);
  }, []);

  useEffect(() => {
    if (!token) {
      setInitials("CN");
      return;
    }
    fetch(`${API}/api/me`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.error || !data.first_name) return;
        const a = (data.first_name || "").trim().charAt(0);
        const b = (data.last_name || "").trim().charAt(0);
        setInitials(
          (a + b).toUpperCase() ||
            (data.email || "?").charAt(0).toUpperCase(),
        );
      })
      .catch(() => {});
  }, [token]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/me`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not load profile");
      }
      setForm({
        email: data.email || "",
        new_email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone_number: data.phone_number || "",
        gender: data.gender != null ? String(data.gender) : "",
        ethnicity: data.ethnicity != null ? String(data.ethnicity) : "",
      });
      const a = (data.first_name || "").trim().charAt(0);
      const b = (data.last_name || "").trim().charAt(0);
      setInitials(
        (a + b).toUpperCase() || (data.email || "?").charAt(0).toUpperCase(),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && token) {
      loadOptions();
      loadProfile();
    }
  }, [open, token, loadOptions, loadProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number || null,
          gender: form.gender || null,
          ethnicity: form.ethnicity || null,
          new_email:
            form.new_email.trim() && form.new_email.trim() !== form.email
              ? form.new_email.trim()
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not save profile");
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.email) {
        setForm((f) => ({
          ...f,
          email: data.email,
          new_email: data.email,
        }));
      }
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setOpen(false);
    navigate({ to: "/auth/login" });
  };

  const avatarInner = (
    <>
      <AvatarImage src={AVATAR_IMG} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </>
  );

  if (!token) {
    return (
      <Avatar>
        <Link to="/auth/login">
          <AvatarImage src={AVATAR_IMG} alt="" />
          <AvatarFallback>CN</AvatarFallback>
        </Link>
      </Avatar>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open profile"
        >
          <Avatar>
            {avatarInner}
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="size-5" />
            Your profile
          </DialogTitle>
          <DialogDescription>
            Update your name, contact info, phone, gender, and ethnicity. Email
            changes keep your account linked (you may get a new session token).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={form.new_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, new_email: e.target.value }))
                }
                autoComplete="email"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="profile-first">First name</Label>
                <Input
                  id="profile-first"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-last">Last name</Label>
                <Input
                  id="profile-last"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={form.phone_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_number: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select
                value={form.gender || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((g) => (
                    <SelectItem key={g.gender_id} value={String(g.gender_id)}>
                      {g.gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ethnicity</Label>
              <Select
                value={form.ethnicity || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, ethnicity: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  {ethnicities.map((r) => (
                    <SelectItem key={r.race_id} value={String(r.race_id)}>
                      {r.race}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
