import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddDialog({
  triggerLabel = "Add Item",
  title = "Add New Item",
  fields = [],
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = "Create",
  children = null,
}) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const result = await onSubmit(data);
    if (result !== false) {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            {children}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : submitLabel}
              </Button>
            </div>
          </form>
        ) : fields.length > 0 ? (
          <SimpleForm
            fields={fields}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            error={error}
            submitLabel={submitLabel}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SimpleForm({ fields, onSubmit, onCancel, isSubmitting, error, submitLabel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        {fields.map((field) => (
          <div key={field.name} className="flex-1 min-w-[200px] space-y-1">
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            {field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">{field.placeholder || "Select..."}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                step={field.step}
                min={field.min}
                placeholder={field.placeholder}
                required={field.required}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
