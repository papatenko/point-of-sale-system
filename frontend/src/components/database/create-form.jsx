import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateForm({
  fields,
  extraFields,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  submitLabel = "Create",
  initialValues = {},
  children = null,
}) {
  const [form, setForm] = useState(() => {
    const initial = {};
    fields.forEach((field) => {
      initial[field.name] = initialValues[field.name] ?? "";
    });
    return initial;
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleReset = () => {
    const reset = {};
    fields.forEach((field) => {
      reset[field.name] = initialValues[field.name] ?? "";
    });
    setForm(reset);
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
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            {field.type === "select" ? (
              <Select
                value={form[field.name]}
                onValueChange={(value) =>
                  handleSelectChange(field.name, value)
                }
                required={field.required}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                step={field.step}
                min={field.min}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
              />
            )}
          </div>
        ))}

        {extraFields?.map((field) => (
          <div key={field.name} className="flex-1 min-w-[200px] space-y-1">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type || "text"}
              step={field.step}
              min={field.min}
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.onChange}
              required={field.required}
            />
          </div>
        ))}
      </div>

      {children}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              onCancel();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
