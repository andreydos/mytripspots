"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useApolloClient } from "@apollo/client";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  Navigation,
  Route,
  StickyNote
} from "lucide-react";
import { PlaceDocument, type PlaceQuery } from "@/graphql/generated/graphql";
import { formatCoord, formatWhen, shortId } from "@/lib/place-display";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false });

type PlaceDetails = NonNullable<PlaceQuery["place"]>;
type LoadState = "loading" | "ready" | "not-found" | "error";

export type PlacePageClientProps = {
  placeId: string;
};

function MetaItem({
  icon: Icon,
  label,
  value,
  mono
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="glass-pill flex min-w-0 flex-col gap-1 rounded-2xl px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5 shrink-0" strokeWidth={2} />
        {label}
      </span>
      <span className={cn("text-sm font-medium text-foreground", mono && "font-mono text-xs leading-relaxed")}>
        {value}
      </span>
    </div>
  );
}

export function PlacePageClient({ placeId }: PlacePageClientProps) {
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const client = useApolloClient();

  const loadPlace = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await client.query<PlaceQuery>({
        query: PlaceDocument,
        variables: { id: placeId },
        fetchPolicy: "no-cache"
      });
      const next = res.data?.place ?? null;
      setPlace(next);
      setLoadState(next ? "ready" : "not-found");
    } catch {
      setPlace(null);
      setLoadState("error");
    }
  }, [client, placeId]);

  useEffect(() => {
    void loadPlace();
  }, [loadPlace]);

  const mapPins = useMemo(
    () =>
      place
        ? [{ id: place.id, title: place.title, lat: place.lat, lng: place.lng }]
        : [],
    [place]
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 gap-2 rounded-full border-border/80 bg-white/60 px-4 shadow-sm backdrop-blur-sm dark:bg-input/30"
          )}
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to dashboard
        </Link>
        {loadState === "ready" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 rounded-full text-muted-foreground"
            onClick={() => void loadPlace()}
          >
            Refresh
          </Button>
        )}
      </div>

      {loadState === "loading" && (
        <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            Loading place…
          </CardContent>
        </Card>
      )}

      {loadState === "not-found" && (
        <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Place not found</CardTitle>
            <CardDescription>
              This pin may have been removed or you may not have access. Check the ID or return to the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-2xl bg-muted/60 px-4 py-3 font-mono text-xs text-muted-foreground">{placeId}</p>
          </CardContent>
        </Card>
      )}

      {loadState === "error" && (
        <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Could not load place</CardTitle>
            <CardDescription>Check your connection and sign-in, then try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="secondary" className="rounded-full" onClick={() => void loadPlace()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {loadState === "ready" && place && (
        <>
          <Card className="overflow-hidden rounded-3xl border-0 bg-card/90 shadow-glass-lg ring-1 ring-foreground/5 backdrop-blur-md">
            <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/15 via-transparent to-transparent pb-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                  <MapPin className="size-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Place</p>
                  <CardTitle className="mt-1 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                    {place.title}
                  </CardTitle>
                  <CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Navigation className="size-3.5" />
                      {formatCoord(place.lat)}, {formatCoord(place.lng)}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
              <MapView places={mapPins} zoom={13} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem
              icon={Navigation}
              label="Coordinates"
              value={`${formatCoord(place.lat)}, ${formatCoord(place.lng)}`}
              mono
            />
            <MetaItem icon={Calendar} label="Visited" value={formatWhen(place.visitedAt)} />
            <MetaItem icon={Clock} label="Added" value={formatWhen(place.createdAt)} />
            <MetaItem icon={Route} label="Trip" value={shortId(place.tripId)} mono />
          </div>

          <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <StickyNote className="size-5 text-primary" strokeWidth={2} />
                Notes
              </CardTitle>
              <CardDescription>Your memories and context for this stop.</CardDescription>
            </CardHeader>
            <CardContent>
              {place.notes?.trim() ? (
                <p className="rounded-2xl border border-border/60 bg-white/50 px-4 py-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap dark:bg-input/20">
                  {place.notes}
                </p>
              ) : (
                <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  No notes yet for this place.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="size-5 text-primary" strokeWidth={2} />
                Photos
              </CardTitle>
              <CardDescription>
                {place.photos.length === 0
                  ? "Upload images from the dashboard to attach them here."
                  : `${place.photos.length} photo${place.photos.length === 1 ? "" : "s"} on this place.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {place.photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/25 py-10 text-center">
                  <ImageIcon className="size-8 text-muted-foreground/70" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">No photos yet</p>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {place.photos.map((photo) => (
                    <li
                      key={photo.id}
                      className="glass-pill flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-white/60 dark:hover:bg-neutral-900/50"
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <ImageIcon className="size-6" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">{photo.mime}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {photo.width && photo.height ? `${photo.width}×${photo.height}` : "Dimensions unknown"}
                        </p>
                        <p className="truncate font-mono text-[0.65rem] text-muted-foreground/80" title={photo.r2Key}>
                          {shortId(photo.id)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
