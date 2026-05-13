import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOG_PATH = "/home/andrew/work/travel-log/.cursor/debug-2e93f5.log";

/** Dev-only NDJSON sink so browser instrumentation can persist when ingest is unreachable. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const raw = await req.text();
    const line = raw.trim();
    if (!line) return NextResponse.json({ ok: true });
    mkdirSync(dirname(LOG_PATH), { recursive: true });
    appendFileSync(LOG_PATH, line + "\n");
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}
