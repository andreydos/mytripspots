"use client";

import type { ReactNode } from "react";
import { AppPageBackground } from "@/components/app-page-background";
import { AppPageHeader, type AppPageHeaderProps } from "@/components/app-page-header";

export type AppShellLayoutProps = {
  children: ReactNode;
} & Pick<AppPageHeaderProps, "accountSlot" | "offlineProfile" | "showSignInWhenSignedOut">;

/** Shared chrome: gradient background, header, and centered main column. */
export function AppShellLayout({
  children,
  accountSlot,
  offlineProfile,
  showSignInWhenSignedOut
}: AppShellLayoutProps) {
  return (
    <AppPageBackground>
      <main className="relative mx-auto max-w-3xl px-4 pt-6 md:max-w-5xl md:px-6 md:pt-10">
        <AppPageHeader
          accountSlot={accountSlot}
          offlineProfile={offlineProfile}
          showSignInWhenSignedOut={showSignInWhenSignedOut}
        />
        {children}
      </main>
    </AppPageBackground>
  );
}
