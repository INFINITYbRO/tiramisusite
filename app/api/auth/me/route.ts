import { NextRequest } from "next/server";
import { authenticate } from "@/lib/server/auth";
import { getRuntimeConfig } from "@/lib/server/config";
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
    return session
      ? noStoreJson({
          authenticated: true,
          user: { username: session.username, createdAt: session.createdAt },
        })
      : noStoreJson({ authenticated: false });
  } catch (error) {
    return jsonError(error);
  }
}
