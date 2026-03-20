import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayoutComponent,
});

function EmployeeLayoutComponent() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    // authSlice now rehydrates from localStorage synchronously, so user is
    // already populated on first render when logged in — no flicker or loop.
    if (!user) {
      navigate({ to: "/auth/login", replace: true });
    }
  }, [user, navigate]);

  // Don't render the dashboard shell at all if not authenticated.
  if (!user) return null;

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