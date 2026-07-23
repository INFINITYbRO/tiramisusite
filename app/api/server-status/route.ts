import { NextResponse } from "next/server";
import { SERVER_ADDRESS } from "../../../lib/site-config";

export const dynamic = "force-dynamic";

interface MinecraftStatusResponse {
  online?: unknown;
  players?: {
    online?: unknown;
    max?: unknown;
  };
}

function asPlayerCount(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function responseHeaders() {
  return {
    "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
  };
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);

  try {
    const address = encodeURIComponent(SERVER_ADDRESS);
    const response = await fetch(
      `https://api.mcstatus.io/v2/status/java/${address}?query=false&timeout=5`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );

    if (!response.ok) throw new Error("Minecraft status provider failed");

    const data = (await response.json()) as MinecraftStatusResponse;
    const online = data.online === true;

    return NextResponse.json(
      {
        status: online ? "online" : "offline",
        playersOnline: online ? (asPlayerCount(data.players?.online) ?? 0) : 0,
        playersMax: asPlayerCount(data.players?.max),
        checkedAt: Date.now(),
      },
      { headers: responseHeaders() },
    );
  } catch {
    return NextResponse.json(
      {
        status: "unknown",
        playersOnline: null,
        playersMax: null,
        checkedAt: Date.now(),
      },
      { headers: responseHeaders() },
    );
  } finally {
    clearTimeout(timeout);
  }
}

