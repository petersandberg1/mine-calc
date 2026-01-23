"use client";

import clsx from "clsx";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(
        "rounded-2xl px-4 py-2 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-scania-accent/40",
        variant === "primary" &&
          "bg-scania-accent text-white hover:opacity-95 active:opacity-90",
        variant === "secondary" &&
          "bg-white text-scania-ink border border-scania-border hover:bg-scania-surface"
      )}
    >
      {children}
    </button>
  );
}