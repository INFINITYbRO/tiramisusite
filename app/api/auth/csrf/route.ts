import { NextRequest } from "next/server";
import {
  authenticate,
  rotateSessionCsrf,
  setAnonymousCsrfCookie,
} from "@/lib/server/auth";
import { getRuntimeConfig } from "@/lib/server/config";
import { randomToken } from "@/lib/server/crypto";
import { jsonError, noStoreJson } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const config = getRuntimeConfig();
    await enforceRateLimit(
      request,
      "api",
      config.apiRateLimitMax,
      config.apiRateLimitWindowSeconds,
    );
    const session = await authenticate(request, config);
    if (session) {
      return noStoreJson({ csrfToken: await rotateSessionCsrf(session) });
    }
    const csrfToken = randomToken();
    const response = noStoreJson({ csrfToken });
    setAnonymousCsrfCookie(response, config, csrfToken);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
