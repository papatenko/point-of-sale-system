import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect } from "react";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayoutComponent,
});

function EmployeeLayoutComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: "/login" }); // Redirige al login si no hay token
    }
  }, []);
  
  return (
    <div className="h-full relative">
      <SidebarProvider className="absolute left-0 top-0 h-full min-h-full">
        <AppSidebar />
        <main>
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
}
