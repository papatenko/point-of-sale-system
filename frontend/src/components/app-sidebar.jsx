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

const employee_routes = [
  {
    name: "POS Screen",
    url: "/employee/pos",
    roles: ["cashier", "manager", "admin"],
    icon: ShoppingCart,
  },
  {
    name: "Current Orders",
    url: "/employee/orders",
    roles: ["cashier", "cook", "manager", "admin"],
    icon: ClipboardList,
  },
  {
    name: "Stats Screen",
    url: "/employee/reports",
    roles: ["manager", "admin"],
    icon: BarChart3,
  },
  {
    name: "Inventory Screen",
    url: "/employee/inventory",
    roles: ["manager", "admin"],
    icon: Package,
  },
  {
    name: "Search Screen",
    url: "/employee/search",
    roles: ["manager", "admin"],
    icon: Search,
  },
];

const database_management_routes = [
  { name: "Ingredients", url: "/employee/database/ingredients", icon: Beef, roles: ["admin"] },
  { name: "Employees", url: "/employee/database/employees", icon: Users, roles: ["admin"] },
  { name: "Menu Items", url: "/employee/database/menu_items", icon: Utensils, roles: ["admin"] },
  { name: "Suppliers", url: "/employee/database/suppliers", icon: Archive, roles: ["admin"] },
  { name: "Food Trucks", url: "/employee/database/food-trucks", icon: Truck, roles: ["admin"] },
  { name: "Recipes", url: "/employee/database/recipes", icon: Scroll, roles: ["admin"] },
  { name: "Users", url: "/employee/database/users", icon: UserCircle, roles: ["admin"] },
  { name: "Backup", url: "/employee/database/backup", icon: Database, roles: ["admin"] },
];

export function AppSidebar() {
  const user = useSelector((s) => s.auth.user);
  const role = user?.role ?? null;

  const visibleRoutes = employee_routes.filter((r) => r.roles.includes(role));
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
              {database_management_routes.filter((r) => r.roles.includes(role)).map((route) => {
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
