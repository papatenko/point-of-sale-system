import { createFileRoute, Link } from "@tanstack/react-router";
import { useSelector } from "react-redux";

export const Route = createFileRoute("/employee/")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">
        Welcome{user?.first_name ? `, ${user.first_name}` : ""}!
      </h1>
      <p className="text-muted-foreground">
        Select an option from the sidebar to get started.
      </p>
    </div>
  );
}