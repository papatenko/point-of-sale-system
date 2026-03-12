import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/employee/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/employee")
      .then((res) => res.text())
      .then((data) => setData(data));
  }, []);

  return <div>{data}</div>;
}
