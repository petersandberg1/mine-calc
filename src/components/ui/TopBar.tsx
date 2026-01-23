"use client";

import { Button } from "@/components/ui/Button";

export function TopBar({
  title,
  onLogout,
}: {
  title: string;
  onLogout?: (() => void) | undefined;
}) {
  return (
    <header className="border-b border-scania-border bg-scania-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-scania-accent" />
          <div>
            <div className="text-sm font-semibold text-white/80">Scania • Prototype</div>
            <div className="text-lg font-semibold text-white">{title}</div>
          </div>
        </div>
        {onLogout ? (
          <Button variant="secondary" onClick={onLogout}>
            Log out
          </Button>
        ) : (
          <div className="text-sm text-white/70">Pre-Sales</div>
        )}
      </div>
    </header>
  );
}