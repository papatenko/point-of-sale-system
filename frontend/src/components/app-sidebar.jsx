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
  Plus,
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
    url: "/employee/jsearch",
    roles: ["manager", "admin"],
    icon: Search,
  },
];

const create_routes = [
  {
    name: "Create Ingredient",
    url: "/employee/create/ingredient",
    roles: ["manager", "admin"],
    icon: Beef,
  },
  {
    name: "Create Employee",
    url: "/employee/create/employee",
    roles: ["admin"],
    icon: Users,
  },
  {
    name: "Create Menu Item",
    url: "/employee/create/menu_item",
    roles: ["manager", "admin"],
    icon: Utensils,
  },
  {
    name: "Create Supplier",
    url: "/employee/create/supplier",
    roles: ["manager", "admin"],
    icon: Truck,
  },
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
          <div className="px-2 py-1.5 mt-4 text-sm font-semibold">Create</div>
          {create_routes.map((route) => {
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
