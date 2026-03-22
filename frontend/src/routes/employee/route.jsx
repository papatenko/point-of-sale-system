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
      navigate({ to: "/auth/login" });
    }
  }, [navigate]);

  return (
    <div className="h-full relative">
      <SidebarProvider className="absolute left-0 top-0 h-full min-h-full">
        <AppSidebar />
        <main className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b px-3">
            <SidebarTrigger />
          </header>
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
