"use client";

import { useEffect, useState } from "react";

type Toast = {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
};

let listeners: ((t: Toast) => void)[] = [];
let counter = 0;

export function toast(
  kind: Toast["kind"],
  message: string,
) {
  const t = { id: ++counter, kind, message };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const palette =
          t.kind === "success"
            ? "bg-liatrio-green text-bg-dark"
            : t.kind === "error"
            ? "bg-warning text-bg-dark"
            : "bg-natera-blue text-white";
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg px-4 py-3 shadow-lg font-medium text-[14px] animate-fade-in ${palette}`}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
