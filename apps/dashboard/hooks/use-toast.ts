import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "default" }: ToastInput) => {
      const id = `toast-${++toastCount}`;
      const newToast: Toast = { id, title, description, variant };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);

      // For development, also log to console
      console.log(`Toast [${variant}]: ${title}`, description);

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}
