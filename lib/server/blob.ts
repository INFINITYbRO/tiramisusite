import { del, put } from "@vercel/blob";
import { getBlobToken } from "./config";
import { ServiceUnavailableError } from "./errors";

export function isTrustedBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "blob.vercel-storage.com" ||
        url.hostname.endsWith(".public.blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

export async function putSkinBlob(
  pathname: string,
  bytes: Uint8Array,
): Promise<string> {
  const token = getBlobToken();
  try {
    const result = await put(pathname, Buffer.from(bytes), {
      access: "public",
      token,
      contentType: "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
    });
    if (!isTrustedBlobUrl(result.url)) {
      throw new ServiceUnavailableError("Skin storage returned an invalid URL");
    }
    return result.url;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw error;
    }
    throw new ServiceUnavailableError("Skin storage is temporarily unavailable");
  }
}

export async function fetchSkinBlob(url: string): Promise<Buffer> {
  if (!isTrustedBlobUrl(url)) {
    throw new ServiceUnavailableError("Stored skin URL is invalid");
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
    });
  } catch {
    throw new ServiceUnavailableError("Skin storage is temporarily unavailable");
  }
  if (!response.ok || response.headers.get("content-type")?.split(";")[0] !== "image/png") {
    throw new ServiceUnavailableError("Stored skin is unavailable or invalid");
  }
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > 1_048_576) {
    throw new ServiceUnavailableError("Stored skin exceeds the configured limit");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 1_048_576) {
    throw new ServiceUnavailableError("Stored skin exceeds the configured limit");
  }
  return bytes;
}

export async function deleteSkinBlob(url: string): Promise<void> {
  if (!isTrustedBlobUrl(url)) return;
  try {
    await del(url, { token: getBlobToken() });
  } catch {
    // Metadata already points at the new immutable blob. Old-object cleanup is
    // best effort and must not turn a committed skin update into an API error.
  }
}
