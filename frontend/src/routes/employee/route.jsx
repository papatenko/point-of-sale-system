import { Outlet, createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLogout } from "@/redux/authSlice";
import { LogOut, ShoppingBag, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayoutComponent,
});

function EmployeeProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user
    ? (user.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
    : "?";

  const roleLabel = {
    admin: "Admin",
    manager: "Manager",
    cashier: "Cashier",
    cook: "Cook",
  }[user?.role] ?? "Employee";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{user?.first_name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {roleLabel}
            </span>
          </div>

          <Link
            to="/employee"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LayoutDashboard size={15} className="text-gray-400" />
            Employee Dashboard
          </Link>
          <Link
            to="/order"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag size={15} className="text-gray-400" />
            Customer Site
          </Link>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function EmployeeLayoutComponent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    })();
    if (!token || !storedUser || storedUser.user_type !== "employee") {
      navigate({ to: "/auth/login", search: { redirect: "/employee" } });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(setLogout());
    navigate({ to: "/auth/login" });
  };

  const roleLabel = {
    admin: "Admin",
    manager: "Manager",
    cashier: "Cashier",
    cook: "Cook",
  }[user?.role] ?? "Employee";

  return (
    <div className="h-full relative">
      <SidebarProvider className="absolute left-0 top-0 h-full min-h-full">
        <AppSidebar />
        <main className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="font-semibold text-gray-800">Shako Kabob</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {roleLabel}
              </span>
            </div>
            {user && (
              <EmployeeProfileDropdown user={user} onLogout={handleLogout} />
            )}
          </header>
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
