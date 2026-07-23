import { NextRequest } from "next/server";
import {
  requireSession,
  requireSessionCsrf,
} from "@/lib/server/auth";
import { getRuntimeConfig } from "@/lib/server/config";
import { jsonError, noStoreJson, requireSameOrigin } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import {
  parseSkinUpload,
  saveOwnedSkin,
  skinApiResponse,
} from "@/lib/server/skins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const config = getRuntimeConfig();
    await enforceRateLimit(
      request,
      "api",
      config.apiRateLimitMax,
      config.apiRateLimitWindowSeconds,
    );
    const session = await requireSession(request, config);
    requireSessionCsrf(request, session);
    const upload = await parseSkinUpload(request);
    const record = await saveOwnedSkin(
      session.userId,
      session.username,
      upload.model,
      upload.bytes,
      upload.hash,
    );
    return noStoreJson(skinApiResponse(record), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
