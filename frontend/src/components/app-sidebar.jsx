import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import LogoutButton from "./logout";

const employee_routes = [
  {
    name: "POS Screen",
    url: "/employee/pos",
    roles: ["cashier", "cook", "manager"],
  },
  {
    name: "Stats Screen",
    url: "/employee/reports",
    roles: ["manager"],
  },
  {
    name: "Inventory Screen",
    url: "/employee/inventory",
    roles: ["manager"],
  },
  {
    name: "Create Screen",
    url: "/employee/creation",
    roles: ["admin"],
  },
  {
    name: "Search Screen",
    url: "/employee/jsearch",
    roles: ["manager", "admin"],
  },
];

export function AppSidebar() {
  return (
    <Sidebar variant="floating" className="absolute h-full">
      <SidebarHeader>
        <SidebarMenu>
          {employee_routes.map((route) => (
            <SidebarMenuItem key={route.name}>
              <SidebarMenuButton asChild>
                <Link to={route.url}>
                  <span>{route.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
        <LogoutButton />
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
}
