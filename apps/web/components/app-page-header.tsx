import type { ReactNode } from "react";
import { Compass, Sparkles } from "lucide-react";
import { AppAccountSlot, type AppAccountOfflineProfile } from "@/components/app-account-slot";

export type AppPageHeaderProps = {
  /** Override the default account control (rare). */
  accountSlot?: ReactNode;
  offlineProfile?: AppAccountOfflineProfile;
  showSignInWhenSignedOut?: boolean;
};

export function AppPageHeader({
  accountSlot,
  offlineProfile,
  showSignInWhenSignedOut
}: AppPageHeaderProps) {
  const resolvedAccountSlot =
    accountSlot ?? (
      <AppAccountSlot offlineProfile={offlineProfile} showSignInWhenSignedOut={showSignInWhenSignedOut} />
    );

  return (
    <header className="glass-panel mb-8 flex flex-col gap-4 rounded-3xl p-5 shadow-glass-lg md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
          <Compass className="size-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5" />
            MyTripSpots
          </p>
          <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Map every trip. Treasure every spot.
          </h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Trips, places, and the map — polished for phone and desktop.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:justify-end">{resolvedAccountSlot}</div>
    </header>
  );
}
