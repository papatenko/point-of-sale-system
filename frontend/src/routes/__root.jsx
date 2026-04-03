import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useSelector, useDispatch } from "react-redux";
import { setLogout } from "@/redux/authSlice";
import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  User,
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Home,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

function ProfileDropdown({ user, onLogout }) {
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-background rounded-xl shadow-lg border border-border py-1 z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">
              {user.first_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {user.role && (
              <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full capitalize">
                {user.role}
              </span>
            )}
          </div>

          {user.user_type === "employee" && (
            <>
              <Link
                to="/employee"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LayoutDashboard size={15} className="text-muted-foreground" />
                Employee Dashboard
              </Link>
              <Link
                to="/order"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <ShoppingBag size={15} className="text-muted-foreground" />
                Customer Site
              </Link>
              <div className="border-t border-border my-1" />
            </>
          )}

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User size={15} className="text-muted-foreground" />
            Profile Settings
          </Link>

          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function RootLayout() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isEmployeeRoute = pathname.startsWith("/employee");
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(setLogout());
    navigate({ to: "/auth/login" });
  };

  useEffect(() => {
  if (pathname.startsWith("http://localhost:3000/api")) {
    navigate({ to: "/" });
  }
}, [pathname, navigate]);

  return (
    <>
      {/* Only show public navbar outside the employee dashboard */}
      {!isEmployeeRoute && (
        <div className="w-full p-2 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-2">
            <Truck className="size-6 text-amber-600" />
            <span className="text-xl font-bold text-amber-600">
              Shako Kabob
            </span>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link to="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link to="/order">Order Online</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="size-5 text-muted-foreground" />
              ) : (
                <Sun className="size-5 text-muted-foreground" />
              )}
            </button>
            {user ? (
              <ProfileDropdown user={user} onLogout={handleLogout} />
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                <User size={14} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout });
