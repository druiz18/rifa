import { useEffect } from "react";

interface ToastProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
  type?: "success" | "error";
}

export default function Toast({
  isOpen,
  message,
  onClose,
  duration = 2200,
  type = "success",
}: ToastProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const tone =
    type === "success"
      ? "bg-green-100 text-green-900 border border-green-800 shadow-green-200"
      : "bg-red-100 text-red-900 border border-red-800 shadow-red-200";

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-[toast-in_0.25s_ease-out]">
      <div
        className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${tone}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}
