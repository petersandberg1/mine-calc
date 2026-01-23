"use client";

import clsx from "clsx";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-scania-border bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-scania-accent/30",
        className
      )}
    />
  );
}