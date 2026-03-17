import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/employee/pos")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleTransatioon = () => {
    console.log("Transaction");
  };

  return (
    <div>
      <Button onClick={handleTransatioon}>Transaction</Button>
    </div>
  );
}
