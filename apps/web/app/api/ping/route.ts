import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lightweight same-origin reachability check (not cached by design). */
export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
