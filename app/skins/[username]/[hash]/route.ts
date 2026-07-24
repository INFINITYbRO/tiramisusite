import { NextRequest } from "next/server";
import { fetchSkinBlob } from "@/lib/server/blob";
import { getRuntimeConfig } from "@/lib/server/config";
import { sha256 } from "@/lib/server/crypto";
import { HttpError } from "@/lib/server/errors";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getSkin } from "@/lib/server/skins";
import { isValidUsername } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ username: string; hash: string }>;
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
    const { username, hash: hashFile } = await context.params;
    if (!isValidUsername(username) || !hashFile.toLowerCase().endsWith(".png")) {
      throw new HttpError(404, "Skin not found");
    }
    const requestedHash = hashFile.slice(0, -4).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(requestedHash)) {
      throw new HttpError(404, "Skin not found");
    }
    const record = await getSkin(username);
    if (!record) throw new HttpError(404, "Skin not found");
    if (record.hash !== requestedHash) {
      throw new HttpError(
        409,
        "Skin version changed; refresh metadata",
        { "Cache-Control": "no-store" },
      );
    }
    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
      "Cross-Origin-Resource-Policy": "cross-origin",
      ETag: `"${record.hash}"`,
    });
    if (request.headers.get("if-none-match")?.replace(/^W\//, "") === `"${record.hash}"`) {
      return new Response(null, { status: 304, headers });
    }
    const bytes = await fetchSkinBlob(record.blobUrl);
    if (sha256(bytes) !== record.hash) {
      throw new HttpError(
        503,
        "Stored skin does not match its metadata",
        { "Cache-Control": "no-store" },
      );
    }
    headers.set("Content-Length", String(bytes.length));
    return new Response(new Uint8Array(bytes), { status: 200, headers });
  } catch (error) {
    return jsonError(error);
  }
}
