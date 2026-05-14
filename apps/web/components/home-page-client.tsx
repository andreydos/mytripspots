"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  useClerk,
  useUser,
  UserButton
} from "@clerk/nextjs";
import {
  Camera,
  ChevronRight,
  Compass,
  Loader2,
  LogIn,
  Map as MapIcon,
  MapPin,
  WifiOff
} from "lucide-react";
import { getSessionSnapshot, getTripsCache, saveSessionSnapshot } from "@/lib/offline/app-cache";
import { TravelDashboard } from "@/components/travel-dashboard";
import { cn } from "@/lib/utils";

function navigatorReportsOffline(): boolean {
  return typeof window !== "undefined" && !navigator.onLine;
}

/** If Clerk never finishes loading (CDN blocked, lying navigator.onLine, localhost still 200). */
const CLERK_STALL_MS = 5000;

function connectivityDown(isOnline: boolean, probeOffline: boolean): boolean {
  return navigatorReportsOffline() || !isOnline || probeOffline;
}


function subscribeNavigatorOnline(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getNavigatorOnlineSnapshot() {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/** Avoid SSR `navigator` missing defaulting to "online" and missing offline events before first paint. */
function useNavigatorOnline(): boolean {
  return useSyncExternalStore(
    subscribeNavigatorOnline,
    getNavigatorOnlineSnapshot,
    () => {
      if (typeof navigator !== "undefined") return navigator.onLine;
      return true;
    }
  );
}

function OfflineBanner() {
  return (
    <div
      role="status"
      className="fixed left-0 right-0 top-0 z-[200] flex items-center justify-center gap-2 border-b border-destructive/80 bg-destructive px-3 py-2.5 text-center text-xs font-medium leading-snug text-destructive-foreground shadow-md sm:text-sm"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <WifiOff className="size-4 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
      <span>No network — offline mode. Showing saved data; server sync is unavailable.</span>
    </div>
  );
}

function SessionLoadingShell() {
  return (
    <div
      className="pointer-events-none fixed bottom-8 left-1/2 z-[100] -translate-x-1/2"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="size-7 animate-spin text-primary/70" strokeWidth={2} aria-hidden />
    </div>
  );
}

function GuestLanding() {
  const features = [
    { icon: MapIcon, label: "Map and routes" },
    { icon: MapPin, label: "Places with notes" },
    { icon: Camera, label: "Photos on spots" }
  ] as const;

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,oklch(0.88_0.16_125/0.45),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] h-px w-[min(90vw,28rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center md:max-w-2xl">
        <div className="mb-8 flex items-center gap-3 md:mb-10">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20">
            <Compass className="size-7" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">MyTripSpots</p>
            <p className="text-sm font-medium text-foreground/80">Trip map and travel diary</p>
          </div>
        </div>

        <h1 className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.05]">
          Open routes that{" "}
          <span className="bg-gradient-to-r from-primary via-[oklch(0.82_0.14_145)] to-[oklch(0.78_0.12_200)] bg-clip-text text-transparent">
            inspire you
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Collect trips, drop pins on the map, and attach photos. Feels like an app — opens fast and works with offline
          drafts.
        </p>

        <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
          {features.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="glass-pill flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground shadow-sm"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Icon className="size-4" strokeWidth={2} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-8 w-full shrink-0">
        <SignInButton mode="modal">
          <button
            type="button"
            className={cn(
              "group flex h-[4.25rem] w-full max-w-lg cursor-pointer items-center gap-3 rounded-full border border-white/50 bg-white/35 px-3 shadow-glass-lg backdrop-blur-xl transition-all duration-300",
              "hover:border-primary/40 hover:bg-white/50 hover:shadow-xl hover:shadow-primary/10",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 md:mx-auto"
            )}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/35 transition-transform duration-300 group-hover:scale-105">
              <LogIn className="size-5" strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-base font-semibold tracking-tight text-foreground">Sign in</span>
              <span className="block truncate text-xs text-muted-foreground">Continue to your account</span>
            </span>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-white/40 text-foreground/80 transition-colors group-hover:bg-primary/15 group-hover:text-primary">
              <ChevronRight className="size-5" strokeWidth={2.5} />
            </span>
          </button>
        </SignInButton>
        <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-muted-foreground">
          Secure sign-in with Clerk. After you sign in, your trip dashboard opens.
        </p>
      </div>
    </div>
  );
}

function OfflineAccountPill({ displayName, avatarUrl }: { displayName?: string; avatarUrl?: string }) {
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
          className="size-10 shrink-0 rounded-full ring-2 ring-white/80 object-cover"
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

export function HomePageClient() {
  const [mounted, setMounted] = useState(false);
  const [probeOffline, setProbeOffline] = useState(false);
  const [probeSettled, setProbeSettled] = useState(false);
  const [clerkStalled, setClerkStalled] = useState(false);
  const isOnline = useNavigatorOnline();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const isSignedInRef = useRef(false);
  isSignedInRef.current = Boolean(isSignedIn);

  useLayoutEffect(() => {
    // Clean up old false sessions from localStorage to avoid conflicts
    const stored = getSessionSnapshot();
    if (stored?.signedIn === false) {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("__mytripspts_session");
      }
    }
    setMounted(true);
  }, []);


  /** After a long offline stretch, Clerk can stay uninitialized until the Frontend API is reachable again. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const maybeLoad = () => {
      const c = clerk as unknown as { load?: () => Promise<void> };
      void c.load?.().catch(() => undefined);
    };
    const onOnline = () => {
      maybeLoad();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [clerk]);

  /** When connectivity becomes reachable again (after a real offline / probe-failed window), re-init Clerk. */
  const wasUnreachableRef = useRef(false);
  useEffect(() => {
    if (!mounted) return;
    const effective = isOnline && !probeOffline;
    if (!effective) {
      wasUnreachableRef.current = true;
      return;
    }
    if (!wasUnreachableRef.current) return;
    wasUnreachableRef.current = false;

    const c = clerk as unknown as { load?: () => Promise<void> };
    void c.load?.().catch(() => undefined);
  }, [mounted, clerk, isOnline, probeOffline]);

  /** Offline detection: navigator may lie when service worker caches content, so always probe. */
  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;

    if (!navigator.onLine) {
      setProbeOffline(false);
      setProbeSettled(true);
      return;
    }

    if (isLoaded) {
      setProbeOffline(false);
      setProbeSettled(false);
      return;
    }

    setProbeSettled(false);
    let cancelled = false;
    const ac = new AbortController();
    const tid = window.setTimeout(() => ac.abort(), 6500);

    void (async () => {
      try {
        const local = await fetch(`${window.location.origin}/api/ping`, {
          method: "GET",
          cache: "no-store",
          signal: ac.signal
        });
        if (cancelled) return;
        if (!local.ok) {
          setProbeOffline(true);
          return;
        }
        const ext = await fetch("https://dns.google/resolve?name=example.com&type=A", {
          method: "GET",
          cache: "no-store",
          signal: ac.signal
        });
        if (cancelled) return;
        if (!ext.ok) {
          setProbeOffline(true);
          return;
        }
        const body = (await ext.json()) as { Status?: number };
        if (body.Status !== 0) {
          setProbeOffline(true);
          return;
        }
        setProbeOffline(false);
      } catch {
        if (cancelled) return;
        setProbeOffline(true);
      } finally {
        clearTimeout(tid);
        if (!cancelled) {
          setProbeSettled(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [mounted, isLoaded, isOnline]);

  useEffect(() => {
    if (isLoaded) setClerkStalled(false);
  }, [isLoaded]);

  useEffect(() => {
    if (!mounted || isLoaded) return;
    const conn = connectivityDown(isOnline, probeOffline);
    if (conn) {
      setClerkStalled(false);
      return;
    }
    if (!probeSettled) return;
    const t = window.setTimeout(() => setClerkStalled(true), CLERK_STALL_MS);
    return () => {
      clearTimeout(t);
    };
  }, [mounted, isLoaded, probeSettled, isOnline, probeOffline]);

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    // Triple-check offline: navigator takes priority (most reliable)
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    // Then check combined connectivity detection
    const connectedState = connectivityDown(isOnline, probeOffline);
    if (connectedState) return;

    // Only save when user is actually signed in. Never save signedIn:false.
    // If Clerk can't load a user (e.g., after reconnect), that's Clerk's issue, not ours.
    // We keep the last known good session until Clerk proves user is signed in again.
    if (isSignedIn) {
      saveSessionSnapshot({
        signedIn: true,
        userId: userId ?? undefined,
        displayName:
          user?.fullName ||
          user?.primaryEmailAddress?.emailAddress ||
          user?.username ||
          undefined,
        avatarUrl: user?.imageUrl || undefined
      });
    }
  }, [isLoaded, isSignedIn, userId, user, isOnline, probeOffline]);

  const connDown = connectivityDown(isOnline, probeOffline);
  const stallBypass = probeSettled && clerkStalled && !isLoaded;
  const navigatorOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const persistedSession = getSessionSnapshot();
  // Clerk sometimes gets stuck at isLoaded:true, isSignedIn:false after reconnect.
  // If we have a saved session but Clerk reports no user, use the cached session as fallback.
  const clerkFailedRecovery = isLoaded && !isSignedIn && persistedSession?.signedIn === true;
  // If truly offline (navigator says so), bypass Clerk and use saved session
  const offlineBypassClerk = mounted && (
    navigatorOffline ||
    (!isLoaded && (connDown || stallBypass)) ||
    (connDown && probeSettled && probeOffline) ||
    clerkFailedRecovery
  );
  const cachedTripsExist = Boolean(getTripsCache()?.length);
  const snapshot = offlineBypassClerk ? persistedSession : null;
  // After connectivity returns, Clerk can stay !isLoaded for a long time; do not replace the cached
  // dashboard with an auth spinner — keep showing trips until Clerk reports ready.
  const bridgeOnlineSignedInDashboard =
    mounted &&
    !offlineBypassClerk &&
    !isLoaded &&
    (persistedSession?.signedIn === true || cachedTripsExist);
  const showOfflineBar = mounted && (connDown || stallBypass);
  const contentTopPad = showOfflineBar ? "pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))]" : "";
  const effectiveOnline = isOnline && !probeOffline;


  const clerkAccountSlot = (
    <div className="glass-pill flex items-center gap-3 rounded-full py-1.5 pl-2 pr-3">
      <UserButton appearance={{ elements: { avatarBox: "size-10 ring-2 ring-white/80 shadow-sm" } }} />
      <span className="text-xs font-medium text-muted-foreground">Account</span>
    </div>
  );

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        contentTopPad
      )}
    >
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

      {showOfflineBar ? <OfflineBanner /> : null}

      {!mounted ? (
        <SessionLoadingShell />
      ) : offlineBypassClerk ? (
        snapshot?.signedIn ? (
          <TravelDashboard
            isOnline={false}
            accountSlot={<OfflineAccountPill displayName={snapshot.displayName} avatarUrl={snapshot.avatarUrl} />}
          />
        ) : (
          <GuestLanding />
        )
      ) : bridgeOnlineSignedInDashboard ? (
        <TravelDashboard
          isOnline={effectiveOnline}
          accountSlot={<OfflineAccountPill displayName={persistedSession?.displayName} avatarUrl={persistedSession?.avatarUrl} />}
        />
      ) : (
        <>
          <ClerkLoading>
            <SessionLoadingShell />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedOut>
              <GuestLanding />
            </SignedOut>

            <SignedIn>
              <TravelDashboard isOnline={effectiveOnline} accountSlot={clerkAccountSlot} />
            </SignedIn>
          </ClerkLoaded>
        </>
      )}
    </div>
  );
}
