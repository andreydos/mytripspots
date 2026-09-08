import { getDrafts, removeDraft, type DraftPlace } from "./drafts";

export async function syncDrafts(syncOne: (draft: DraftPlace) => Promise<boolean>): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const drafts = getDrafts().sort((a, b) => a.updatedAt - b.updatedAt);
  for (const draft of drafts) {
    let ok = false;
    try {
      ok = await syncOne(draft);
    } catch {
      ok = false;
    }
    if (ok) {
      removeDraft(draft.localId);
    }
  }
}
