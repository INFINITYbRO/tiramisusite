import { ServiceUnavailableError } from "./errors";

export interface RuntimeConfig {
  databaseUrl: string;
  adminApiKey: string;
  publicBaseUrl: string;
  sessionCookieName: string;
  sessionLifetimeSeconds: number;
  registrationEnabled: boolean;
  authRateLimitMax: number;
  authRateLimitWindowSeconds: number;
  apiRateLimitMax: number;
  apiRateLimitWindowSeconds: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ServiceUnavailableError(
      `Server configuration is incomplete: ${name} is not configured`,
    );
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ServiceUnavailableError(
      `Server configuration is invalid: ${name} must be a positive integer`,
    );
  }
  return value;
}

function booleanValue(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new ServiceUnavailableError(
    `Server configuration is invalid: ${name} must be true or false`,
  );
}

export function getDatabaseUrl(): string {
  const value = required("DATABASE_URL");
  try {
    const url = new URL(value);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error();
    }
  } catch {
    throw new ServiceUnavailableError(
      "Server configuration is invalid: DATABASE_URL must be a PostgreSQL URL",
    );
  }
  return value;
}

export function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function getPublicBaseUrl(): string {
  const publicBaseUrl = required("PUBLIC_BASE_URL").replace(/\/+$/, "");
  try {
    const url = new URL(publicBaseUrl);
    if (
      url.origin !== publicBaseUrl ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
        ))
    ) {
      throw new Error();
    }
  } catch {
    throw new ServiceUnavailableError(
      "Server configuration is invalid: PUBLIC_BASE_URL must be an HTTP(S) origin",
    );
  }
  return publicBaseUrl;
}

export function getAdminApiKey(): string | undefined {
  return process.env.ADMIN_API_KEY?.trim() || undefined;
}

export function getRuntimeConfig(): RuntimeConfig {
  const sessionCookieName =
    process.env.SESSION_COOKIE_NAME?.trim() || "tiramisu_session";
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(sessionCookieName)) {
    throw new ServiceUnavailableError(
      "Server configuration is invalid: SESSION_COOKIE_NAME is invalid",
    );
  }

  return {
    databaseUrl: getDatabaseUrl(),
    publicBaseUrl: getPublicBaseUrl(),
    adminApiKey: getAdminApiKey() ?? "",
    sessionCookieName,
    sessionLifetimeSeconds: positiveInteger("SESSION_LIFETIME_SECONDS", 604_800),
    registrationEnabled: booleanValue("REGISTRATION_ENABLED", false),
    authRateLimitMax: positiveInteger("AUTH_RATE_LIMIT_MAX", 10),
    authRateLimitWindowSeconds: positiveInteger(
      "AUTH_RATE_LIMIT_WINDOW_SECONDS",
      900,
    ),
    apiRateLimitMax: positiveInteger("API_RATE_LIMIT_MAX", 120),
    apiRateLimitWindowSeconds: positiveInteger(
      "API_RATE_LIMIT_WINDOW_SECONDS",
      60,
    ),
  };
}
