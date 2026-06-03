import type { ReactNode } from "react";

export function AppPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,oklch(0.92_0.12_125/0.35),transparent_55%),radial-gradient(ellipse_100%_60%_at_100%_0%,oklch(0.88_0.08_200/0.2),transparent_50%),linear-gradient(180deg,oklch(0.97_0.02_95),oklch(0.96_0.025_90))]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -left-16 bottom-1/4 -z-10 h-64 w-64 rounded-full bg-accent/40 blur-3xl"
      />
      {children}
    </div>
  );
}
