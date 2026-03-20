import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee/database")({
  component: DatabaseLayoutComponent,
});

function DatabaseLayoutComponent() {
  return <Outlet />;
}
