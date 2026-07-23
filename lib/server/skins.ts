import { NextRequest } from "next/server";
import { deleteSkinBlob, putSkinBlob } from "./blob";
import { getPublicBaseUrl } from "./config";
import { safeStringEquals, sha256 } from "./crypto";
import { sql } from "./db";
import { HttpError, ServiceUnavailableError } from "./errors";
import { normalizeMinecraftPng } from "./png";
import {
  isSkinModel,
  normalizeUsername,
  type SkinModel,
} from "./validation";

export const MAX_SKIN_SIZE_BYTES = 1_048_576;

export interface SkinRecord {
  username: string;
  model: SkinModel;
  blobUrl: string;
  hash: string;
  updatedAt: number;
  userId?: string;
}

interface SkinRow {
  username: string;
  model: SkinModel;
  blob_url: string;
  hash: string;
  updated_at: string;
  user_id?: string | null;
}

export interface SkinApiResponse {
  username: string;
  skinUrl: string;
  model: SkinModel;
  updatedAt: number;
  hash: string;
}

export function skinApiResponse(record: SkinRecord): SkinApiResponse {
  return {
    username: record.username,
    skinUrl: `${getPublicBaseUrl()}/skins/${encodeURIComponent(record.username)}.png`,
    model: record.model,
    updatedAt: record.updatedAt,
    hash: record.hash,
  };
}

export async function getSkin(username: string): Promise<SkinRecord | undefined> {
  const [row] = await sql<SkinRow>(
    `SELECT username, model, blob_url, hash, updated_at, user_id
     FROM skins WHERE username_key = $1`,
    [normalizeUsername(username)],
  );
  return row
    ? {
        username: row.username,
        model: row.model,
        blobUrl: row.blob_url,
        hash: row.hash,
        updatedAt: Number(row.updated_at),
        userId: row.user_id ?? undefined,
      }
    : undefined;
}

export async function parseSkinUpload(
  request: NextRequest,
): Promise<{ model: SkinModel; bytes: Buffer; hash: string }> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_SKIN_SIZE_BYTES + 65_536) {
    throw new HttpError(413, "Multipart upload is too large");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError(400, "Invalid multipart upload");
  }
  const model = form.get("model");
  const skin = form.get("skin");
  if (!isSkinModel(model)) {
    throw new HttpError(400, "Model must be default or slim");
  }
  if (!(skin instanceof File)) {
    throw new HttpError(400, "A PNG file is required in the skin field");
  }
  if (
    skin.type.toLowerCase() !== "image/png" ||
    !skin.name.toLowerCase().endsWith(".png")
  ) {
    throw new HttpError(400, "Only .png files with image/png MIME type are allowed");
  }
  if (skin.size <= 0 || skin.size > MAX_SKIN_SIZE_BYTES) {
    throw new HttpError(413, "Skin exceeds the 1048576-byte limit");
  }
  const normalized = normalizeMinecraftPng(
    new Uint8Array(await skin.arrayBuffer()),
  );
  if (normalized.bytes.length > MAX_SKIN_SIZE_BYTES) {
    throw new HttpError(413, "Normalized skin exceeds the 1048576-byte limit");
  }
  return {
    model,
    bytes: normalized.bytes,
    hash: sha256(normalized.bytes),
  };
}

async function uploadImmutableSkin(
  usernameKey: string,
  bytes: Buffer,
  hash: string,
): Promise<string> {
  return putSkinBlob(`skins/${usernameKey}/${hash}.png`, bytes);
}

export async function saveOwnedSkin(
  userId: string,
  username: string,
  model: SkinModel,
  bytes: Buffer,
  hash: string,
): Promise<SkinRecord> {
  const usernameKey = normalizeUsername(username);
  const existing = await getSkin(username);
  if (existing && existing.userId !== userId) {
    throw new HttpError(409, "This skin is administrator-managed");
  }
  const blobUrl = await uploadImmutableSkin(usernameKey, bytes, hash);
  const updatedAt = Math.floor(Date.now() / 1000);
  const [row] = await sql<SkinRow>(
    `INSERT INTO skins(username_key, username, user_id, model, blob_url, hash, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (username_key) DO UPDATE SET
       model = EXCLUDED.model,
       blob_url = EXCLUDED.blob_url,
       hash = EXCLUDED.hash,
       updated_at = EXCLUDED.updated_at
     WHERE skins.user_id = EXCLUDED.user_id
     RETURNING username, model, blob_url, hash, updated_at, user_id`,
    [usernameKey, username, userId, model, blobUrl, hash, updatedAt],
  );
  if (!row) {
    throw new HttpError(409, "This skin is administrator-managed");
  }
  if (existing && existing.blobUrl !== row.blob_url) {
    await deleteSkinBlob(existing.blobUrl);
  }
  return {
    username: row.username,
    model: row.model,
    blobUrl: row.blob_url,
    hash: row.hash,
    updatedAt: Number(row.updated_at),
    userId: row.user_id ?? undefined,
  };
}

export async function saveAdministratorSkin(
  username: string,
  model: SkinModel,
  bytes: Buffer,
  hash: string,
): Promise<SkinRecord> {
  const usernameKey = normalizeUsername(username);
  const existing = await getSkin(username);
  const blobUrl = await uploadImmutableSkin(usernameKey, bytes, hash);
  const updatedAt = Math.floor(Date.now() / 1000);
  const [row] = await sql<SkinRow>(
    `INSERT INTO skins(username_key, username, user_id, model, blob_url, hash, updated_at)
     VALUES (
       $1, $2, NULL, $3, $4, $5, $6
     )
     ON CONFLICT (username_key) DO UPDATE SET
       username = EXCLUDED.username,
       user_id = NULL,
       model = EXCLUDED.model,
       blob_url = EXCLUDED.blob_url,
       hash = EXCLUDED.hash,
       updated_at = EXCLUDED.updated_at
     RETURNING username, model, blob_url, hash, updated_at, user_id`,
    [usernameKey, username, model, blobUrl, hash, updatedAt],
  );
  if (!row) {
    throw new ServiceUnavailableError("Skin metadata could not be saved");
  }
  if (existing && existing.blobUrl !== row.blob_url) {
    await deleteSkinBlob(existing.blobUrl);
  }
  return {
    username: row.username,
    model: row.model,
    blobUrl: row.blob_url,
    hash: row.hash,
    updatedAt: Number(row.updated_at),
    userId: row.user_id ?? undefined,
  };
}

export function requireAdministratorKey(
  request: NextRequest,
  expected: string | undefined,
): void {
  if (!expected) {
    throw new ServiceUnavailableError("Administrator skin upload is not configured");
  }
  const header = request.headers.get("x-api-key");
  const authorization = request.headers.get("authorization");
  const received =
    header || (authorization?.startsWith("Bearer ") ? authorization.slice(7) : "");
  if (!safeStringEquals(received, expected)) {
    throw new HttpError(401, "Invalid administrator API key");
  }
}
