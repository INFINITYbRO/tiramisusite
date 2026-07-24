import { NextRequest } from "next/server";
import { getAdminApiKey, getRuntimeConfig } from "@/lib/server/config";
import { HttpError } from "@/lib/server/errors";
import {
  jsonError,
  noStoreJson,
  requireSameOrigin,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import {
  getSkin,
  parseSkinUpload,
  requireAdministratorKey,
  saveAdministratorSkin,
  skinApiResponse,
} from "@/lib/server/skins";
import { isValidUsername } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ username: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const config = getRuntimeConfig();
    await enforceRateLimit(
      request,
      "api",
      config.apiRateLimitMax,
      config.apiRateLimitWindowSeconds,
    );
    const { username } = await context.params;
    if (!isValidUsername(username)) {
      throw new HttpError(
        400,
        "Username must contain 3-16 ASCII letters, digits, or underscores",
      );
    }
    const record = await getSkin(username);
    if (!record) throw new HttpError(404, "Skin not found");
    return noStoreJson(skinApiResponse(record));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const origin = request.headers.get("origin");
    if (origin) requireSameOrigin(request);
    const config = getRuntimeConfig();
    await enforceRateLimit(
      request,
      "api",
      config.apiRateLimitMax,
      config.apiRateLimitWindowSeconds,
    );
    requireAdministratorKey(request, getAdminApiKey());
    const { username } = await context.params;
    if (!isValidUsername(username)) {
      throw new HttpError(
        400,
        "Username must contain 3-16 ASCII letters, digits, or underscores",
      );
    }
    const upload = await parseSkinUpload(request);
    const record = await saveAdministratorSkin(
      username,
      upload.model,
      upload.bytes,
      upload.hash,
    );
    return noStoreJson(skinApiResponse(record), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
