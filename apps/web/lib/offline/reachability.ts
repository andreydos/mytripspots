/** Same-origin probe used when navigator.onLine may be wrong (e.g. service worker). */
export async function probeSameOriginReachable(
  origin: string,
  signal?: AbortSignal
): Promise<boolean> {
  const response = await fetch(`${origin}/api/ping`, {
    method: "GET",
    cache: "no-store",
    signal
  });
  return response.ok;
}
