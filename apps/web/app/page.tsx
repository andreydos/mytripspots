import { HomePageClient } from "@/components/home-page-client";

export default function HomePage() {
  return (
    <>
      <section className="sr-only">
        <h1>MyTripSpots — trip map and travel diary</h1>
        <p>
          Collect trips, drop pins on the map, and attach photos. Works as a PWA: opens fast, syncs when online, and
          supports offline drafts.
        </p>
        <ul>
          <li>Map and routes</li>
          <li>Places with notes</li>
          <li>Photos on trip spots</li>
        </ul>
      </section>
      <HomePageClient />
    </>
  );
}
