import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayoutComponent,
});

function EmployeeLayoutComponent() {
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
