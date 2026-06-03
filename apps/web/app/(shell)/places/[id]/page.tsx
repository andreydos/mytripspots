import { PlacePageClient } from "@/components/place-page-client";

type PlacePageProps = {
  params: { id: string };
};

export default function PlacePage({ params }: PlacePageProps) {
  return <PlacePageClient placeId={params.id} />;
}
