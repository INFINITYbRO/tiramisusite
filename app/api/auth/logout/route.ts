import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  requireSession,
  requireSessionCsrf,
  revokeSession,
} from "@/lib/server/auth";
import { getRuntimeConfig } from "@/lib/server/config";
import { jsonError, requireSameOrigin } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

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
    await revokeSession(session);
    const response = new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
    clearAuthCookies(response, config);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
