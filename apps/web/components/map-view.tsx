"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type PlacePin = {
  id: string;
  title: string;
  lat: number;
  lng: number;
};

export function MapView({ places }: { places: PlacePin[] }) {
  const center: [number, number] = places.length ? [places[0].lat, places[0].lng] : [51.505, -0.09];
  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: 360, width: "100%", borderRadius: 12, overflow: "hidden" }}
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {places.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
          <Popup>{p.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
