import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/employee/pos")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleTransaction = async () => {
    const transaction = {
      items: [
        { name: "Product A", price: 10.99, quantity: 2 },
        { name: "Product B", price: 5.5, quantity: 1 },
      ],
      total: 27.48,
    };

    console.log("Sending transaction:", transaction);

    try {
      const response = await fetch("/api/employee/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      const result = await response.text();
      console.log("Transaction result:", result);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  return (
    <div>
      <Button onClick={handleTransaction}>Process Transaction</Button>
    </div>
  );
}
