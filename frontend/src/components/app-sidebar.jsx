import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  BarChart3,
  Package,
  Search,
  Beef,
  Users,
  Utensils,
  Truck,
  Scroll,
  Archive,
  UserCircle,
  Database,
  ClipboardList,
} from "lucide-react";
import { useSelector } from "react-redux";
import { EMPLOYEE_ROUTES, DATABASE_MANAGEMENT_ROUTES } from "@/data/routes";

export function AppSidebar() {
  const user = useSelector((s) => s.auth.user);
  const role = user?.role ?? null;

  const visibleRoutes = EMPLOYEE_ROUTES.filter((r) => r.roles.includes(role));
  const showDatabase = role === "admin";

  return (
    <Sidebar variant="floating" className="absolute h-full">
      <SidebarHeader>
        <SidebarMenu>
          <div className="px-2 py-1.5 text-sm font-semibold">Main</div>
          {visibleRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <SidebarMenuItem key={route.name}>
                <SidebarMenuButton asChild>
                  <Link to={route.url}>
                    <Icon />
                    <span>{route.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {showDatabase && (
            <>
              <div className="px-2 py-1.5 mt-4 text-sm font-semibold">
                Database Management
              </div>
              {DATABASE_MANAGEMENT_ROUTES.filter((r) =>
                r.roles.includes(role),
              ).map((route) => {
                const Icon = route.icon;
                return (
                  <SidebarMenuItem key={route.name}>
                    <SidebarMenuButton asChild>
                      <Link to={route.url}>
                        <Icon />
                        <span>{route.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </>
          )}
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
}
