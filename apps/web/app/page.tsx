"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { gql } from "@apollo/client";
import { getGraphqlClient } from "@/lib/graphql/client";
import { putDraft } from "@/lib/offline/drafts";

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
    if (bytes === null) return "-";
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
    <main>
      <h1>Travel PWA</h1>
      <SignedOut>
        <SignInButton mode="modal">Sign in</SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="card">
          <UserButton />
          <button onClick={loadTrips}>Refresh trips</button>
        </div>

        <div className="card">
          <h3>Create trip</h3>
          <input value={tripTitle} onChange={(e) => setTripTitle(e.target.value)} placeholder="Trip title" />
          <button onClick={createTrip}>Create</button>
        </div>

        <div className="card">
          <h3>Trips</h3>
          <select value={selectedTrip} onChange={(e) => setSelectedTrip(e.target.value)}>
            <option value="">Select trip</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title} ({trip.visibility})
              </option>
            ))}
          </select>
          <button onClick={loadPlaces}>Load places</button>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title/notes" />
        </div>

        <div className="card">
          <h3>Add place</h3>
          <form action={createPlace}>
            <input name="title" placeholder="Title" required />
            <input name="lat" type="number" step="any" placeholder="Latitude" required />
            <input name="lng" type="number" step="any" placeholder="Longitude" required />
            <input name="notes" placeholder="Notes" />
            <button type="submit">Save place</button>
          </form>
        </div>

        <div className="card">
          <h3>Map</h3>
          <MapView places={sortedPlaces} />
        </div>

        <div className="card">
          <h3>Upload photo</h3>
          <select value={selectedPlaceId} onChange={(e) => setSelectedPlaceId(e.target.value)}>
            <option value="">Select place</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSelectedFile(file);
              setOriginalSizeBytes(file ? file.size : null);
              setCompressedSizeBytes(null);
              setUploadState("");
            }}
          />
          <button onClick={uploadPhoto} disabled={!selectedFile || !selectedPlaceId}>
            Upload
          </button>
          <p>Before: {formatFileSize(originalSizeBytes)}</p>
          <p>After: {formatFileSize(compressedSizeBytes)}</p>
          {uploadState ? <p>{uploadState}</p> : null}
        </div>
      </SignedIn>
    </main>
  );
}
