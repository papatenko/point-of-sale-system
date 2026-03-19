import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee/create")({
  component: CreateLayoutComponent,
});

function CreateLayoutComponent() {
  return <Outlet />;
}
