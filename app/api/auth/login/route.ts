import { NextRequest } from "next/server";
import {
  createSession,
  dummyPasswordHash,
  findUser,
  requireAnonymousCsrf,
  revokeRequestSession,
  setSessionCookie,
} from "@/lib/server/auth";
import { getRuntimeConfig } from "@/lib/server/config";
import { validatePassword, verifyPassword } from "@/lib/server/crypto";
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
    const body = await readJsonObject(request);
    if (!isValidUsername(body.username) || validatePassword(body.password)) {
      throw new HttpError(400, "Invalid username or password format");
    }
    const user = await findUser(normalizeUsername(body.username));
    const passwordIsValid = await verifyPassword(
      body.password as string,
      user?.passwordHash ?? dummyPasswordHash(),
    );
    if (!user || !passwordIsValid) {
      throw new HttpError(401, "Invalid username or password");
    }
    const sessionToken = await createSession(user.id, config);
    await revokeRequestSession(request, config);
    const response = noStoreJson({
      user: { username: user.username, createdAt: user.createdAt },
    });
    setSessionCookie(response, config, sessionToken);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
