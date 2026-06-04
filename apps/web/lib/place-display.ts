/** Display helpers for place detail UI (unit-tested). */

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "Not set";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function formatCoord(value: number): string {
  return value.toFixed(5);
}

export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
