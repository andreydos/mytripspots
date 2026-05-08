const DRAFT_KEY = "draft_places";
const PENDING_UPLOADS_KEY = "pending_uploads";

export type DraftPlace = {
  localId: string;
  tripId: string;
  title: string;
  notes?: string;
  lat: number;
  lng: number;
  updatedAt: number;
};

export type PendingUpload = {
  localId: string;
  placeId: string;
  key: string;
  mime: string;
  fileName: string;
  updatedAt: number;
};

export function getDrafts(): DraftPlace[] {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? (JSON.parse(raw) as DraftPlace[]) : [];
}

export function putDraft(draft: DraftPlace): void {
  const next = getDrafts().filter((d) => d.localId !== draft.localId);
  next.push(draft);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}

export function getPendingUploads(): PendingUpload[] {
  const raw = localStorage.getItem(PENDING_UPLOADS_KEY);
  return raw ? (JSON.parse(raw) as PendingUpload[]) : [];
}

export function putPendingUpload(item: PendingUpload): void {
  const next = getPendingUploads().filter((d) => d.localId !== item.localId);
  next.push(item);
  localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(next));
}
