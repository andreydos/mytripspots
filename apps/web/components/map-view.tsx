"use client";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type PlacePin = {
  id: string;
  title: string;
  lat: number;
  lng: number;
};

function assetSrc(mod: string | { src: string }): string {
  return typeof mod === "string" ? mod : mod.src;
}

/** Default Leaflet marker images resolve to the page origin under Next.js; use bundled assets. */
const defaultMarkerIcon = L.icon({
  iconUrl: assetSrc(markerIcon),
  iconRetinaUrl: assetSrc(markerIcon2x),
  shadowUrl: assetSrc(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function MapView({ places }: { places: PlacePin[] }) {
  const center: [number, number] = places.length ? [places[0].lat, places[0].lng] : [51.505, -0.09];
  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={false}
      className="leaflet-container z-0 shadow-inner ring-1 ring-black/5"
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {places.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={defaultMarkerIcon}>
          <Popup>{p.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
