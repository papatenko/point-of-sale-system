import { useEffect, useState } from "react";
import { AlertTriangle, XCircle, AlertCircle, Info, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ICONS = {
  destructive: AlertTriangle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const STYLES = {
  destructive: "text-amber-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
  success: "text-green-500",
};

export function AlertPopup({
  open,
  onOpenChange,
  title,
  description,
  variant = "info",
  onConfirm,
  confirmLabel = "Confirm",
  autoDismiss = 3000,
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : localOpen;

  useEffect(() => {
    if (!isControlled && open) {
      setLocalOpen(open);
    }
  }, [open, isControlled]);

  useEffect(() => {
    if (variant === "info" && isOpen && autoDismiss > 0) {
      const timer = setTimeout(() => {
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setLocalOpen(false);
        }
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [isOpen, variant, autoDismiss, isControlled, onOpenChange]);

  const handleOpenChange = (newOpen) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setLocalOpen(newOpen);
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    handleOpenChange(false);
  };

  const Icon = ICONS[variant];
  const iconStyle = STYLES[variant];

  const showCancel = variant === "destructive" || variant === "warning" || !!onConfirm;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`size-5 ${iconStyle}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel ? (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={
                  variant === "destructive"
                    ? "bg-destructive hover:bg-destructive/90"
                    : ""
                }
              >
                {confirmLabel}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={() => handleOpenChange(false)}>
              OK
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useAlertPopup() {
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    title: "",
    description: "",
    variant: "info",
    confirmLabel: "Confirm",
    onConfirm: null,
    autoDismiss: 3000,
  });

  const showAlert = (config) => {
    setAlertConfig({
      open: true,
      title: config.title || "",
      description: config.description || "",
      variant: config.variant || "info",
      confirmLabel: config.confirmLabel || "Confirm",
      onConfirm: config.onConfirm || null,
      autoDismiss: config.autoDismiss ?? 3000,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, open: false }));
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    AlertPopupComponent: () => (
      <AlertPopup
        open={alertConfig.open}
        onOpenChange={(open) => setAlertConfig((prev) => ({ ...prev, open }))}
        title={alertConfig.title}
        description={alertConfig.description}
        variant={alertConfig.variant}
        confirmLabel={alertConfig.confirmLabel}
        onConfirm={alertConfig.onConfirm}
        autoDismiss={alertConfig.autoDismiss}
      />
    ),
  };
}
