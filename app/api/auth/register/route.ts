import { NextRequest } from "next/server";
import {
  createSession,
  registerUser,
  requireAnonymousCsrf,
  revokeRequestSession,
  setSessionCookie,
} from "@/lib/server/auth";
import { getRuntimeConfig } from "@/lib/server/config";
import { hashPassword, validatePassword } from "@/lib/server/crypto";
import { HttpError } from "@/lib/server/errors";
import {
  jsonError,
  noStoreJson,
  readJsonObject,
  requireSameOrigin,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import {
  isValidUsername,
  normalizeUsername,
} from "@/lib/server/validation";

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
    await enforceRateLimit(
      request,
      "auth",
      config.authRateLimitMax,
      config.authRateLimitWindowSeconds,
    );
    requireAnonymousCsrf(request, config);
    if (!config.registrationEnabled) {
      throw new HttpError(403, "Public registration is disabled");
    }
    const body = await readJsonObject(request);
    if (!isValidUsername(body.username)) {
      throw new HttpError(
        400,
        "Username must contain 3-16 ASCII letters, digits, or underscores",
      );
    }
    const passwordError = validatePassword(body.password);
    if (passwordError) throw new HttpError(400, passwordError);
    const user = await registerUser(
      body.username,
      normalizeUsername(body.username),
      await hashPassword(body.password as string),
    );
    if (!user) {
      throw new HttpError(
        409,
        "Username is already registered or has an administrator-managed skin",
      );
    }
    const sessionToken = await createSession(user.id, config);
    await revokeRequestSession(request, config);
    const response = noStoreJson(
      {
        user: { username: user.username, createdAt: user.createdAt },
      },
      { status: 201 },
    );
    setSessionCookie(response, config, sessionToken);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
