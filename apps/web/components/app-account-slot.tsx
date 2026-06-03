"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export type AppAccountOfflineProfile = {
  displayName?: string;
  avatarUrl?: string;
};

export type AppAccountSlotProps = {
  /** Cached profile when Clerk is unavailable (offline bridge). */
  offlineProfile?: AppAccountOfflineProfile;
  /** Show a sign-in control when the user is signed out. Default: true. */
  showSignInWhenSignedOut?: boolean;
};

function OfflineAccountPill({ displayName, avatarUrl }: AppAccountOfflineProfile) {
  const label = displayName?.trim() || "Account";
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="glass-pill flex items-center gap-3 rounded-full py-1.5 pl-2 pr-3">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={label}
          className="size-10 shrink-0 rounded-full object-cover ring-2 ring-white/80"
        />
      ) : (
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary ring-2 ring-white/80"
          aria-hidden
        >
          {initials || "?"}
        </span>
      )}
      <span className="max-w-[10rem] truncate text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function ClerkAccountPill() {
  return (
    <div className="glass-pill flex items-center gap-3 rounded-full py-1.5 pl-2 pr-3">
      <UserButton appearance={{ elements: { avatarBox: "size-10 ring-2 ring-white/80 shadow-sm" } }} />
      <span className="text-xs font-medium text-muted-foreground">Account</span>
    </div>
  );
}

export function AppAccountSlot({
  offlineProfile,
  showSignInWhenSignedOut = true
}: AppAccountSlotProps) {
  if (offlineProfile) {
    return <OfflineAccountPill {...offlineProfile} />;
  }

  return (
    <>
      <SignedIn>
        <ClerkAccountPill />
      </SignedIn>
      {showSignInWhenSignedOut ? (
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="secondary" size="lg" className="h-11 rounded-full px-5 font-semibold shadow-md">
              Sign in
            </Button>
          </SignInButton>
        </SignedOut>
      ) : null}
    </>
  );
}
