"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { gql } from "@apollo/client";
import {
  Camera,
  ChevronRight,
  Compass,
  ImagePlus,
  LogIn,
  Map as MapIcon,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Search,
  Sparkles,
  Upload
} from "lucide-react";
import { getGraphqlClient } from "@/lib/graphql/client";
import { putDraft } from "@/lib/offline/drafts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false });

const TRIPS_QUERY = gql`
  query Trips {
    myTrips {
      id
      title
      visibility
    }
  }
`;

const CREATE_TRIP_MUTATION = gql`
  mutation CreateTrip($title: String!) {
    createTrip(title: $title) {
      id
      title
      visibility
    }
  }
`;

const PLACES_QUERY = gql`
  query Places($tripId: String!, $search: String) {
    tripPlaces(tripId: $tripId, search: $search) {
      id
      title
      lat
      lng
      notes
    }
  }
`;

const CREATE_PLACE_MUTATION = gql`
  mutation CreatePlace($tripId: String!, $title: String!, $lat: Float!, $lng: Float!, $notes: String) {
    createPlace(tripId: $tripId, title: $title, lat: $lat, lng: $lng, notes: $notes) {
      id
    }
  }
`;

const INIT_UPLOAD_MUTATION = gql`
  mutation InitUpload($mime: String!, $sizeBytes: Int!, $ext: String!) {
    initUpload(mime: $mime, sizeBytes: $sizeBytes, ext: $ext) {
      key
      presignedUrl
    }
  }
`;

const COMPLETE_UPLOAD_MUTATION = gql`
  mutation CompleteUpload($placeId: String!, $key: String!, $mime: String!, $width: Int, $height: Int) {
    completeUpload(placeId: $placeId, key: $key, mime: $mime, width: $width, height: $height) {
      id
      r2Key
    }
  }
`;

const selectTriggerClass = cn(
  "flex h-11 w-full min-w-0 cursor-pointer appearance-none rounded-2xl border border-input bg-white/70 px-4 py-2 text-sm shadow-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

const fieldClass = "h-11 rounded-2xl border-input bg-white/80 text-base shadow-sm backdrop-blur-sm md:text-sm dark:bg-input/25";

function GuestLanding() {
  const features = [
    { icon: MapIcon, label: "Карта и маршруты" },
    { icon: MapPin, label: "Точки с заметками" },
    { icon: Camera, label: "Фото к местам" }
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
            <p className="text-sm font-medium text-foreground/80">Карта и дневник поездок</p>
          </div>
        </div>

        <h1 className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.05]">
          Откройте маршруты,{" "}
          <span className="bg-gradient-to-r from-primary via-[oklch(0.82_0.14_145)] to-[oklch(0.78_0.12_200)] bg-clip-text text-transparent">
            которые вдохновляют
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Собирайте поездки, ставьте точки на карте и прикрепляйте снимки. Работает как приложение — быстро открывается и
          дружит с офлайн-черновиками.
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
              <span className="block text-base font-semibold tracking-tight text-foreground">Войти</span>
              <span className="block truncate text-xs text-muted-foreground">Продолжить в аккаунт</span>
            </span>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-white/40 text-foreground/80 transition-colors group-hover:bg-primary/15 group-hover:text-primary">
              <ChevronRight className="size-5" strokeWidth={2.5} />
            </span>
          </button>
        </SignInButton>
        <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-muted-foreground">
          Безопасный вход через Clerk. После входа откроется ваша панель поездок.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { getToken } = useAuth();
  const [tripTitle, setTripTitle] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [uploadState, setUploadState] = useState<string>("");
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number | null>(null);
  const [compressedSizeBytes, setCompressedSizeBytes] = useState<number | null>(null);
  const [places, setPlaces] = useState<Array<{ id: string; title: string; lat: number; lng: number; notes?: string }>>([]);
  const [trips, setTrips] = useState<Array<{ id: string; title: string; visibility: string }>>([]);

  const sortedPlaces = useMemo(() => places.slice().sort((a, b) => a.title.localeCompare(b.title)), [places]);

  async function loadTrips() {
    const token = await getToken();
    const client = getGraphqlClient(token || undefined);
    const res = await client.query<{ myTrips: Array<{ id: string; title: string; visibility: string }> }>({
      query: TRIPS_QUERY,
      fetchPolicy: "no-cache"
    });
    setTrips(res.data.myTrips);
    if (!selectedTrip && res.data.myTrips[0]) setSelectedTrip(res.data.myTrips[0].id);
  }

  async function createTrip() {
    if (!tripTitle) return;
    const token = await getToken();
    const client = getGraphqlClient(token || undefined);
    await client.mutate({
      mutation: CREATE_TRIP_MUTATION,
      variables: { title: tripTitle }
    });
    setTripTitle("");
    await loadTrips();
  }

  async function loadPlaces() {
    if (!selectedTrip) return;
    const token = await getToken();
    const client = getGraphqlClient(token || undefined);
    const res = await client.query<{ tripPlaces: Array<{ id: string; title: string; lat: number; lng: number; notes?: string }> }>({
      query: PLACES_QUERY,
      variables: { tripId: selectedTrip, search: search || null },
      fetchPolicy: "no-cache"
    });
    setPlaces(res.data.tripPlaces);
  }

  async function createPlace(formData: FormData) {
    const title = String(formData.get("title") || "");
    const notes = String(formData.get("notes") || "");
    const lat = Number(formData.get("lat"));
    const lng = Number(formData.get("lng"));
    if (!selectedTrip || !title || Number.isNaN(lat) || Number.isNaN(lng)) return;

    if (!navigator.onLine) {
      putDraft({
        localId: crypto.randomUUID(),
        tripId: selectedTrip,
        title,
        notes,
        lat,
        lng,
        updatedAt: Date.now()
      });
      return;
    }

    const token = await getToken();
    const client = getGraphqlClient(token || undefined);
    await client.mutate({
      mutation: CREATE_PLACE_MUTATION,
      variables: { tripId: selectedTrip, title, notes, lat, lng }
    });
    await loadPlaces();
  }

  async function uploadPhoto() {
    if (!selectedFile || !selectedPlaceId) return;
    setOriginalSizeBytes(selectedFile.size);
    setCompressedSizeBytes(null);
    setUploadState("Compressing image...");
    const compressed = await compressImageToTarget(selectedFile);
    setCompressedSizeBytes(compressed.size);

    const token = await getToken();
    const client = getGraphqlClient(token || undefined);
    const ext = "webp";
    const init = await client.mutate<{ initUpload: { key: string; presignedUrl: string } }>({
      mutation: INIT_UPLOAD_MUTATION,
      variables: { mime: compressed.type, sizeBytes: compressed.size, ext }
    });
    const upload = init.data?.initUpload;
    if (!upload) return;
    setUploadState("Uploading...");
    await fetch(upload.presignedUrl, {
      method: "PUT",
      body: compressed,
      headers: { "Content-Type": compressed.type }
    });
    await client.mutate({
      mutation: COMPLETE_UPLOAD_MUTATION,
      variables: {
        placeId: selectedPlaceId,
        key: upload.key,
        mime: compressed.type
      }
    });
    setSelectedFile(null);
    setUploadState("Upload complete");
  }

  function formatFileSize(bytes: number | null): string {
    if (bytes === null) return "—";
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function compressImageToTarget(file: File, targetBytes: number = 3 * 1024 * 1024): Promise<File> {
    const bitmap = await createImageBitmap(file);
    let maxSide = 2560;
    let quality = 0.82;

    const renderBlob = async (limitSide: number, q: number): Promise<Blob> => {
      const scale = Math.min(1, limitSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", q));
      if (!blob) throw new Error("Image compression failed");
      return blob;
    };

    let best = await renderBlob(maxSide, quality);
    while (best.size > targetBytes && quality > 0.55) {
      quality -= 0.07;
      best = await renderBlob(maxSide, quality);
    }

    while (best.size > targetBytes && maxSide > 1280) {
      maxSide = Math.round(maxSide * 0.85);
      quality = 0.82;
      best = await renderBlob(maxSide, quality);
      while (best.size > targetBytes && quality > 0.55) {
        quality -= 0.07;
        best = await renderBlob(maxSide, quality);
      }
    }

    const normalizedName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([best], `${normalizedName}.webp`, { type: "image/webp" });
  }

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

      <SignedOut>
        <GuestLanding />
      </SignedOut>

      <SignedIn>
        <main className="relative mx-auto max-w-3xl px-4 pt-6 md:max-w-5xl md:px-6 md:pt-10">
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
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <div className="glass-pill flex items-center gap-3 rounded-full py-1.5 pl-2 pr-3">
                <UserButton
                  appearance={{
                    elements: { avatarBox: "size-10 ring-2 ring-white/80 shadow-sm" }
                  }}
                />
                <span className="text-xs font-medium text-muted-foreground">Account</span>
              </div>
            </div>
          </header>
          <div className="flex flex-col gap-6 md:gap-8">
            <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <RefreshCw className="size-5 text-primary" strokeWidth={2} />
                    Your trips
                  </CardTitle>
                  <CardDescription>Sync the list from the server.</CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-11 gap-2 rounded-full px-5 font-semibold shadow-md"
                  onClick={loadTrips}
                >
                  <RefreshCw className="size-4" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-muted-foreground">
                  {trips.length === 0 ? "No trips loaded yet — tap Refresh." : `${trips.length} trip${trips.length === 1 ? "" : "s"} ready.`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="size-5 text-primary" />
                  Create trip
                </CardTitle>
                <CardDescription>Name your next adventure.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="trip-title">Title</Label>
                  <Input
                    id="trip-title"
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    placeholder="e.g. Iceland ring road"
                    className={fieldClass}
                  />
                </div>
                <Button
                  size="lg"
                  className="h-12 shrink-0 rounded-full px-8 font-semibold shadow-lg shadow-primary/25 sm:mb-0"
                  onClick={createTrip}
                  disabled={!tripTitle.trim()}
                >
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Route className="size-5 text-primary" />
                  Trips &amp; places
                </CardTitle>
                <CardDescription>Pick a trip, load pins, filter by text.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trip-select">Active trip</Label>
                    <select
                      id="trip-select"
                      value={selectedTrip}
                      onChange={(e) => setSelectedTrip(e.target.value)}
                      className={selectTriggerClass}
                    >
                      <option value="">Select trip</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title} ({trip.visibility})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-places" className="flex items-center gap-1.5">
                      <Search className="size-3.5 text-muted-foreground" />
                      Search
                    </Label>
                    <Input
                      id="search-places"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Title or notes"
                      className={fieldClass}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 w-full rounded-2xl border-2 font-semibold sm:w-auto sm:rounded-full sm:px-8"
                  onClick={loadPlaces}
                  disabled={!selectedTrip}
                >
                  Load places
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="size-5 text-primary" />
                  Add place
                </CardTitle>
                <CardDescription>Drop a pin with coordinates — fields stack on small screens.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createPlace} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="place-title">Title</Label>
                    <Input id="place-title" name="title" placeholder="Waterfall" required className={fieldClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="place-lat">Latitude</Label>
                    <Input
                      id="place-lat"
                      name="lat"
                      type="number"
                      step="any"
                      placeholder="64.15"
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="place-lng">Longitude</Label>
                    <Input
                      id="place-lng"
                      name="lng"
                      type="number"
                      step="any"
                      placeholder="-21.67"
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="place-notes">Notes</Label>
                    <Input id="place-notes" name="notes" placeholder="Optional" className={fieldClass} />
                  </div>
                  <div className="flex items-end sm:col-span-2 lg:col-span-4">
                    <Button
                      type="submit"
                      size="lg"
                      variant="secondary"
                      className="h-12 w-full rounded-full font-semibold shadow-md md:w-auto md:min-w-[200px]"
                      disabled={!selectedTrip}
                    >
                      Save place
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-0 bg-card/90 shadow-glass-lg ring-1 ring-foreground/5 backdrop-blur-md">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-lg">Map</CardTitle>
                <CardDescription>Live view of loaded places.</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
                <MapView places={sortedPlaces} />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImagePlus className="size-5 text-primary" />
                  Upload photo
                </CardTitle>
                <CardDescription>Attach a compressed image to a place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="photo-place">Place</Label>
                    <select
                      id="photo-place"
                      value={selectedPlaceId}
                      onChange={(e) => setSelectedPlaceId(e.target.value)}
                      className={selectTriggerClass}
                    >
                      <option value="">Select place</option>
                      {places.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo-file">File</Label>
                    <Input
                      id="photo-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={cn(fieldClass, "h-11 cursor-pointer py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground")}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        setOriginalSizeBytes(file ? file.size : null);
                        setCompressedSizeBytes(null);
                        setUploadState("");
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    size="lg"
                    className="h-12 gap-2 rounded-full px-8 font-semibold shadow-lg shadow-primary/20"
                    onClick={uploadPhoto}
                    disabled={!selectedFile || !selectedPlaceId}
                  >
                    <Upload className="size-4" />
                    Upload
                  </Button>
                  <div className="glass-pill rounded-2xl px-4 py-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Before:</span> {formatFileSize(originalSizeBytes)}
                    <span className="mx-2 text-border">·</span>
                    <span className="font-medium text-foreground">After:</span> {formatFileSize(compressedSizeBytes)}
                  </div>
                </div>
                {uploadState ? (
                  <p className="text-sm font-medium text-primary">{uploadState}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </main>
      </SignedIn>
    </div>
  );
}
