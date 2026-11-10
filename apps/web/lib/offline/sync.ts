import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { CreatePlaceDocument } from "@/graphql/generated/graphql";
import { getDrafts, removeDraft } from "./drafts";

export async function syncPlaceDrafts(
  client: ApolloClient<NormalizedCacheObject>,
  isCancelled?: () => boolean
): Promise<number> {
  if (!navigator.onLine) return 0;

  let synced = 0;
  const drafts = getDrafts().sort((a, b) => b.updatedAt - a.updatedAt);
  for (const draft of drafts) {
    if (isCancelled?.()) return synced;

    try {
      await client.mutate({
        mutation: CreatePlaceDocument,
        variables: {
          tripId: draft.tripId,
          title: draft.title,
          notes: draft.notes ?? null,
          lat: draft.lat,
          lng: draft.lng
        }
      });
      removeDraft(draft.localId);
      synced += 1;
    } catch {
      /* keep draft for a later retry */
    }
  }

  return synced;
}
