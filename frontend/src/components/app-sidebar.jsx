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
} from "lucide-react";

const employee_routes = [
  {
    name: "POS Screen",
    url: "/employee/pos",
    roles: ["cashier", "cook", "manager"],
    icon: ShoppingCart,
  },
  {
    name: "Stats Screen",
    url: "/employee/reports",
    roles: ["manager"],
    icon: BarChart3,
  },
  {
    name: "Inventory Screen",
    url: "/employee/inventory",
    roles: ["manager"],
    icon: Package,
  },
  {
    name: "Search Screen",
    url: "/employee/search",
    roles: ["manager", "admin"],
    icon: Search,
  },
];

const database_routes = [
  { name: "Ingredients", url: "/employee/database/ingredients", icon: Beef },
  { name: "Employees", url: "/employee/database/employees", icon: Users },
  { name: "Menu Items", url: "/employee/database/menu_items", icon: Utensils },
  { name: "Suppliers", url: "/employee/database/suppliers", icon: Truck },
];

export function AppSidebar() {
  return (
    <Sidebar variant="floating" className="absolute h-full">
      <SidebarHeader>
        <SidebarMenu>
          <div className="px-2 py-1.5 text-sm font-semibold">Main</div>
          {employee_routes.map((route) => {
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
          <div className="px-2 py-1.5 mt-4 text-sm font-semibold">Database Entries</div>
          {database_routes.map((route) => {
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
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
}
