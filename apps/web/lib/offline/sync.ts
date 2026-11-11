import { getDrafts, removeDraft, type DraftPlace } from "./drafts";

/** Push offline place drafts to the server when connectivity is available. */
export async function syncPlaceDrafts(publish: (draft: DraftPlace) => Promise<void>): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const drafts = getDrafts().sort((a, b) => a.updatedAt - b.updatedAt);
  for (const draft of drafts) {
    try {
      await publish(draft);
      removeDraft(draft.localId);
    } catch {
      /* keep draft for a later retry */
    }
  }
}
