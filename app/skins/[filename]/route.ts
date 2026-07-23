import { NextRequest } from "next/server";
import { fetchSkinBlob } from "@/lib/server/blob";
import { getRuntimeConfig } from "@/lib/server/config";
import { HttpError } from "@/lib/server/errors";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getSkin } from "@/lib/server/skins";
import { isValidUsername } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ filename: string }>;
}

export function etagMatches(header: string | null, hash: string): boolean {
  if (!header) return false;
  return header
    .split(",")
    .map((value) => value.trim().replace(/^W\//, ""))
    .some((value) => value === "*" || value === `"${hash}"`);
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const config = getRuntimeConfig();
    await enforceRateLimit(
      request,
      "skin",
      config.apiRateLimitMax,
      config.apiRateLimitWindowSeconds,
    );
    const { filename } = await context.params;
    if (!filename.toLowerCase().endsWith(".png")) {
      throw new HttpError(404, "Skin not found");
    }
    const username = filename.slice(0, -4);
    if (!isValidUsername(username)) {
      throw new HttpError(
        400,
        "Username must contain 3-16 ASCII letters, digits, or underscores",
      );
    }
    const record = await getSkin(username);
    if (!record) throw new HttpError(404, "Skin not found");
    const headers = new Headers({
      "Cache-Control": "public, max-age=600, must-revalidate",
      "Content-Type": "image/png",
      "Cross-Origin-Resource-Policy": "cross-origin",
      ETag: `"${record.hash}"`,
    });
    if (etagMatches(request.headers.get("if-none-match"), record.hash)) {
      return new Response(null, { status: 304, headers });
    }
    const bytes = await fetchSkinBlob(record.blobUrl);
    headers.set("Content-Length", String(bytes.length));
    return new Response(new Uint8Array(bytes), { status: 200, headers });
  } catch (error) {
    return jsonError(error);
  }
}
