import { getDrafts } from "./drafts";

export async function syncDrafts(onSync: (draftId: string) => Promise<void>): Promise<void> {
  if (!navigator.onLine) return;
  const drafts = getDrafts().sort((a, b) => b.updatedAt - a.updatedAt);
  for (const draft of drafts) {
    await onSync(draft.localId);
  }
}
