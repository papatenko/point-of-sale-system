import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export function AddButton({ showForm, onToggle, addLabel = "Add Item" }) {
  return (
    <Button onClick={onToggle}>
      {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
      {showForm ? "Cancel" : addLabel}
    </Button>
  );
}
