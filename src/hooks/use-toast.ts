import { useState, useCallback } from "react";

export interface Toast {
  id?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "destructive";
  duration?: number;
}

export interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

export function toast(props: Toast) {
  const id = props.id || `toast-${toastCount++}`;
  const event = new CustomEvent("toast", {
    detail: { ...props, id }
  });
  window.dispatchEvent(event);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((props: Toast) => {
    const id = props.id || `toast-${toastCount++}`;
    const newToast = { ...props, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  return {
    toast: addToast,
    dismiss,
    toasts
  };
}

export { toast as sonner };