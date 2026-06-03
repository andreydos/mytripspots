"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApolloClient } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { PlaceDocument, type PlaceQuery } from "@/graphql/generated/graphql";
import styles from "./place-page.module.css";

type PlaceDetails = NonNullable<PlaceQuery["place"]>;

export type PlacePageClientProps = {
  placeId: string;
};

export function PlacePageClient({ placeId }: PlacePageClientProps) {
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const client = useApolloClient();

  const loadPlace = useCallback(async () => {
    const res = await client.query<PlaceQuery>({
      query: PlaceDocument,
      variables: { id: placeId }
    });
    setPlace(res.data?.place ?? null);
  }, [client, placeId]);

  useEffect(() => {
    void loadPlace();
  }, [loadPlace]);

  return (
    <Card className="rounded-3xl border-0 bg-card/90 shadow-glass ring-1 ring-foreground/5 backdrop-blur-md">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="size-5 text-primary" strokeWidth={2} />
          Place details
        </CardTitle>
        <CardDescription>Detailed information about the place.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="break-all font-mono text-sm text-foreground">{placeId}</p>
        <div className={styles.placeContainer}>
          <div className={styles.placeHeader}>
            <h1 className={styles.placeTitle}>{place?.title}</h1>
            <p className={styles.placeSubtitle}>{place?.tripId}</p>
          </div>
          <div className={styles.placeBody}>
            <p className={styles.placeNotes}>{place?.notes}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
