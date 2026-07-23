import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NextRequest, NextResponse } from "next/server";
import { PNG } from "pngjs";
import {
  clearAuthCookies,
  setSessionCookie,
} from "../lib/server/auth";
import { isTrustedBlobUrl } from "../lib/server/blob";
import {
  getBlobToken,
  getPublicBaseUrl,
  getRuntimeConfig,
  type RuntimeConfig,
} from "../lib/server/config";
import {
  hashPassword,
  safeTokenEquals,
  sha256,
  validatePassword,
  verifyPassword,
} from "../lib/server/crypto";
import { ServiceUnavailableError } from "../lib/server/errors";
import { requireSameOrigin } from "../lib/server/http";
import { normalizeMinecraftPng } from "../lib/server/png";
import {
  isSkinModel,
  isValidUsername,
  normalizeUsername,
} from "../lib/server/validation";
import { etagMatches } from "../app/skins/[filename]/route";

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
});

function config(): RuntimeConfig {
  return {
    databaseUrl: "postgresql://user:secret@example.neon.tech/database",
    adminApiKey: "",
    publicBaseUrl: "https://example.com",
    sessionCookieName: "tiramisu_session",
    sessionLifetimeSeconds: 604_800,
    registrationEnabled: false,
    authRateLimitMax: 10,
    authRateLimitWindowSeconds: 900,
    apiRateLimitMax: 120,
    apiRateLimitWindowSeconds: 60,
  };
}

describe("serverless validation and cryptography", () => {
  it("validates canonical Minecraft usernames and models", () => {
    assert.equal(isValidUsername("Player_123"), true);
    assert.equal(isValidUsername("../Player"), false);
    assert.equal(isValidUsername("имя"), false);
    assert.equal(normalizeUsername("__Proto__"), "__proto__");
    assert.equal(isSkinModel("default"), true);
    assert.equal(isSkinModel("slim"), true);
    assert.equal(isSkinModel("alex"), false);
  });

  it("hashes passwords with salted scrypt and never embeds plaintext", async () => {
    const password = "correct horse battery staple";
    assert.equal(validatePassword(password), undefined);
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    assert.notEqual(first, second);
    assert.equal(first.includes(password), false);
    assert.equal(await verifyPassword(password, first), true);
    assert.equal(await verifyPassword("wrong-password-value", first), false);
  });

  it("compares only fixed-size random token hashes", () => {
    const token = "a".repeat(64);
    assert.equal(safeTokenEquals(token, sha256(token)), true);
    assert.equal(safeTokenEquals("a", sha256(token)), false);
  });
});

describe("serverless request security", () => {
  it("requires an exact same Origin, rejecting missing and lookalike origins", () => {
    requireSameOrigin(
      new NextRequest("https://craft.example/api/auth/login", {
        method: "POST",
        headers: { Origin: "https://craft.example" },
      }),
    );
    for (const origin of [
      undefined,
      "https://evil.example",
      "https://craft.example.evil.example",
      "https://sub.craft.example",
    ]) {
      const request = new NextRequest("https://craft.example/api/auth/login", {
        method: "POST",
        headers: origin ? { Origin: origin } : {},
      });
      assert.throws(() => requireSameOrigin(request));
    }
  });

  it("sets and clears hardened session cookies with identical scope", () => {
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, config(), "a".repeat(64));
    const issued = response.headers.get("set-cookie") ?? "";
    assert.match(issued, /HttpOnly/i);
    assert.match(issued, /Secure/i);
    assert.match(issued, /SameSite=Strict/i);
    assert.match(issued, /Path=\//i);

    const clearedResponse = NextResponse.json({ ok: true });
    clearAuthCookies(clearedResponse, config());
    const cleared = clearedResponse.headers.get("set-cookie") ?? "";
    assert.match(cleared, /Max-Age=0/i);
    assert.match(cleared, /HttpOnly/i);
    assert.match(cleared, /Secure/i);
    assert.match(cleared, /SameSite=Strict/i);
    assert.match(cleared, /Path=\//i);
  });

  it("fails closed without runtime env and validates PUBLIC_BASE_URL as a clean origin", () => {
    delete process.env.DATABASE_URL;
    delete process.env.PUBLIC_BASE_URL;
    assert.throws(() => getRuntimeConfig(), ServiceUnavailableError);

    process.env.PUBLIC_BASE_URL = "https://user:secret@example.com";
    assert.throws(() => getPublicBaseUrl());
    process.env.PUBLIC_BASE_URL = "https://example.com/?query=secret";
    assert.throws(() => getPublicBaseUrl());
    process.env.PUBLIC_BASE_URL = "http://example.com";
    assert.throws(() => getPublicBaseUrl());
    process.env.PUBLIC_BASE_URL = "http://127.0.0.1:3000";
    assert.equal(getPublicBaseUrl(), "http://127.0.0.1:3000");

    delete process.env.BLOB_READ_WRITE_TOKEN;
    assert.equal(getBlobToken(), undefined);
    process.env.BLOB_READ_WRITE_TOKEN = "legacy-local-token";
    assert.equal(getBlobToken(), "legacy-local-token");
  });
});

describe("PNG and cache helpers", () => {
  it("normalizes a legacy 64x32 skin into a hashed RGBA 64x64 PNG", () => {
    const legacy = new PNG({ width: 64, height: 32 });
    legacy.data.fill(127);
    const input = PNG.sync.write(legacy);
    const normalized = normalizeMinecraftPng(input);
    const decoded = PNG.sync.read(normalized.bytes);
    assert.equal(normalized.convertedLegacy, true);
    assert.equal(decoded.width, 64);
    assert.equal(decoded.height, 64);
    assert.match(sha256(normalized.bytes), /^[a-f0-9]{64}$/);
  });

  it("rejects malformed dimensions and corrupted CRC", () => {
    const wrongSize = new PNG({ width: 32, height: 32 });
    wrongSize.data.fill(255);
    assert.throws(() => normalizeMinecraftPng(PNG.sync.write(wrongSize)));
    const valid = PNG.sync.write(new PNG({ width: 64, height: 64 }));
    valid[valid.length - 5] ^= 0xff;
    assert.throws(() => normalizeMinecraftPng(valid));
  });

  it("matches strong/weak ETags and validates trusted Blob hosts", () => {
    const hash = "b".repeat(64);
    assert.equal(etagMatches(`W/"${hash}"`, hash), true);
    assert.equal(etagMatches(`"${"c".repeat(64)}"`, hash), false);
    assert.equal(
      isTrustedBlobUrl(
        "https://store.public.blob.vercel-storage.com/skins/player/hash.png",
      ),
      true,
    );
    assert.equal(isTrustedBlobUrl("http://127.0.0.1/private.png"), false);
    assert.equal(
      isTrustedBlobUrl(
        "https://store.public.blob.vercel-storage.com.evil.example/skin.png",
      ),
      false,
    );
  });
});
