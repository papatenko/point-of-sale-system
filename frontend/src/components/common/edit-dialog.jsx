import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sanitizeName } from "@/utils/constraints";

export function EditDialog({
  open,
  onOpenChange,
  mode = "edit",
  title,
  fields = [],
  initialData = {},
  readOnlyFields = [],
  onSubmit,
  onSuccess,
  isSubmitting = false,
  submitLabel,
}) {
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    if (open) {
      const initial = {};
      fields.forEach((field) => {
        if (field.formatOnChange) {
          initial[field.name] = field.formatValue
            ? field.formatValue(initialData[field.name])
            : initialData[field.name] || "";
        }
      });
      setFieldValues(initial);
    }
  }, [open, fields, initialData]);

  const handleFieldChange = useCallback((field, value) => {
    let processedValue = value;
    if (field.sanitizeOnChange) {
      processedValue = sanitizeName(value);
    } else if (field.formatOnChange && field.formatValue) {
      processedValue = field.formatValue(value);
    }
    setFieldValues((prev) => ({ ...prev, [field.name]: processedValue }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!onSubmit) {
      console.error("EditDialog: onSubmit prop is required but was not provided");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    Object.entries(fieldValues).forEach(([key, value]) => {
      if (data[key] !== value) {
        data[key] = value;
      }
    });

    try {
      const result = await onSubmit(data);
      if (result !== false) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("EditDialog: Error during form submission:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getDefaultValue = (field) => {
    if (field.formatOnChange && fieldValues[field.name] !== undefined) {
      return fieldValues[field.name];
    }
    if (mode === "edit" && initialData[field.name] !== undefined) {
      return initialData[field.name];
    }
    return field.defaultValue || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form key={JSON.stringify(initialData)} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            {fields.map((field) => (
              <div
                key={field.name}
                className={`${
                  field.fullWidth ? "w-full" : "flex-1"
                } min-w-[200px] space-y-1`}
              >
                <label
                  htmlFor={field.name}
                  className="text-sm font-medium"
                >
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    defaultValue={getDefaultValue(field)}
                    disabled={field.disabled || (mode === "edit" && readOnlyFields.includes(field.name))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                  >
                    <option value="">{field.placeholder || "Select..."}</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={field.rows || 3}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={getDefaultValue(field)}
                    disabled={field.disabled || (mode === "edit" && readOnlyFields.includes(field.name))}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-50 min-h-[60px]"
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type || "text"}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    minLength={field.minLength}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={getDefaultValue(field)}
                    disabled={field.disabled || (mode === "edit" && readOnlyFields.includes(field.name))}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                mode === "edit"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : ""
              }
            >
              {isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : submitLabel || (mode === "edit" ? "Save Changes" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
