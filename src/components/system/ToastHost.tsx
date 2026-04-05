'use client';

import { useEffect, type ReactElement } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";
import { ToastMessage, useToastStore } from "@/store/toastStore";

const toastColors: Record<ToastMessage["type"], string> = {
  success: "from-emerald-500/15 to-green-500/10 text-green-100 border-green-500/20",
  error: "from-rose-500/20 to-orange-500/10 text-rose-100 border-rose-500/25",
  info: "from-blue-500/15 to-indigo-500/10 text-blue-100 border-blue-500/20",
};

const toastIcon: Record<ToastMessage["type"], ReactElement> = {
  success: <FiCheckCircle className="text-lg" />,
  error: <FiAlertCircle className="text-lg" />,
  info: <FiInfo className="text-lg" />,
};

type ToastItemProps = {
  toast: ToastMessage;
};

function ToastItem({ toast }: ToastItemProps) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 4200);
    return () => clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <div
      className={`glass-panel relative flex min-w-[280px] max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-black/30 ${toastColors[toast.type]}`}
    >
      <span className="mt-1 text-xl">{toastIcon[toast.type]}</span>
      <div className="flex-1">
        {toast.title ? (
          <p className="text-sm font-semibold text-white">{toast.title}</p>
        ) : null}
        <p className="text-sm leading-relaxed text-white/90">{toast.message}</p>
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="rounded-full px-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

export function ToastHost() {
  const { toasts } = useToastStore();

  return (
    <div className="pointer-events-none fixed left-4 bottom-4 z-[60] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
