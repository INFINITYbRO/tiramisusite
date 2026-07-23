import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRuntimeConfig, type RuntimeConfig } from "./config";
import { randomToken, safeTokenEquals, sha256 } from "./crypto";
import { sql } from "./db";
import { HttpError } from "./errors";

const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$BwcHBwcHBwcHBwcHBwcHBw==$wNr61r5/1DFRMaE9YLiZe7zh/kQS0cL3t30DD8oobfFiXWvrWJOMz6H05nWIMq3GErR/ZiumXYdeCsAl/Aywaw==";

export interface PublicUser {
  username: string;
  createdAt: number;
}

export interface UserWithPassword extends PublicUser {
  id: string;
  passwordHash: string;
}

export interface AuthenticatedSession {
  userId: string;
  username: string;
  createdAt: number;
  tokenHash: string;
  csrfHash: string;
  expiresAt: number;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

interface SessionRow {
  user_id: string;
  username: string;
  created_at: string;
  token_hash: string;
  csrf_hash: string;
  expires_at: string;
}

function cookieOptions(config: RuntimeConfig) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge: config.sessionLifetimeSeconds,
  };
}

function anonymousCsrfCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 600,
  };
}

export function csrfCookieName(config: RuntimeConfig): string {
  return `${config.sessionCookieName}_csrf`;
}

export function setSessionCookie(
  response: NextResponse,
  config: RuntimeConfig,
  token: string,
): void {
  response.cookies.set(config.sessionCookieName, token, cookieOptions(config));
  response.cookies.delete({
    name: csrfCookieName(config),
    ...anonymousCsrfCookieOptions(),
  });
}

export function clearAuthCookies(
  response: NextResponse,
  config: RuntimeConfig,
): void {
  response.cookies.set(config.sessionCookieName, "", {
    ...cookieOptions(config),
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(csrfCookieName(config), "", {
    ...anonymousCsrfCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}

export function setAnonymousCsrfCookie(
  response: NextResponse,
  config: RuntimeConfig,
  token: string,
): void {
  response.cookies.set(
    csrfCookieName(config),
    token,
    anonymousCsrfCookieOptions(),
  );
}

export function requireAnonymousCsrf(
  request: NextRequest,
  config: RuntimeConfig,
): void {
  const cookie = request.cookies.get(csrfCookieName(config))?.value ?? "";
  const header = request.headers.get("x-csrf-token") ?? "";
  if (
    !/^[a-f0-9]{64}$/.test(cookie) ||
    !/^[a-f0-9]{64}$/.test(header) ||
    !safeTokenEquals(header, sha256(cookie))
  ) {
    throw new HttpError(403, "Invalid CSRF token");
  }
}

export async function findUser(usernameKey: string): Promise<UserWithPassword | undefined> {
  const [row] = await sql<UserRow>(
    `SELECT id, username, password_hash, created_at
     FROM users WHERE username_key = $1`,
    [usernameKey],
  );
  return row
    ? {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        createdAt: Number(row.created_at),
      }
    : undefined;
}

export async function registerUser(
  username: string,
  usernameKey: string,
  passwordHash: string,
): Promise<UserWithPassword | undefined> {
  const [row] = await sql<UserRow>(
    `INSERT INTO users(id, username, username_key, password_hash, created_at)
     SELECT $1, $2, $3, $4, $5
     WHERE NOT EXISTS (
       SELECT 1 FROM skins WHERE username_key = $3
     )
     ON CONFLICT (username_key) DO NOTHING
     RETURNING id, username, password_hash, created_at`,
    [
      randomUUID(),
      username,
      usernameKey,
      passwordHash,
      Math.floor(Date.now() / 1000),
    ],
  );
  return row
    ? {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        createdAt: Number(row.created_at),
      }
    : undefined;
}

export async function createSession(
  userId: string,
  config: RuntimeConfig,
): Promise<string> {
  const token = randomToken();
  const csrfToken = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await sql(
    `INSERT INTO sessions(token_hash, csrf_hash, user_id, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      sha256(token),
      sha256(csrfToken),
      userId,
      now,
      now + config.sessionLifetimeSeconds,
    ],
  );
  await sql(
    `DELETE FROM sessions
     WHERE token_hash IN (
       SELECT token_hash FROM sessions
       WHERE user_id = $1
       ORDER BY created_at DESC, token_hash DESC
       OFFSET 5
     )`,
    [userId],
  );
  return token;
}

export async function authenticate(
  request: NextRequest,
  config = getRuntimeConfig(),
): Promise<AuthenticatedSession | undefined> {
  const token = request.cookies.get(config.sessionCookieName)?.value ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) return undefined;
  const [row] = await sql<SessionRow>(
    `SELECT s.user_id, u.username, u.created_at, s.token_hash,
            s.csrf_hash, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [sha256(token), Math.floor(Date.now() / 1000)],
  );
  return row
    ? {
        userId: row.user_id,
        username: row.username,
        createdAt: Number(row.created_at),
        tokenHash: row.token_hash,
        csrfHash: row.csrf_hash,
        expiresAt: Number(row.expires_at),
      }
    : undefined;
}

export async function requireSession(
  request: NextRequest,
  config = getRuntimeConfig(),
): Promise<AuthenticatedSession> {
  const session = await authenticate(request, config);
  if (!session) throw new HttpError(401, "Authentication required");
  return session;
}

export function requireSessionCsrf(
  request: NextRequest,
  session: AuthenticatedSession,
): void {
  const token = request.headers.get("x-csrf-token") ?? "";
  if (!safeTokenEquals(token, session.csrfHash)) {
    throw new HttpError(403, "Invalid CSRF token");
  }
}

export async function rotateSessionCsrf(
  session: AuthenticatedSession,
): Promise<string> {
  const token = randomToken();
  const rows = await sql<{ token_hash: string }>(
    `UPDATE sessions SET csrf_hash = $1
     WHERE token_hash = $2 AND expires_at > $3
     RETURNING token_hash`,
    [sha256(token), session.tokenHash, Math.floor(Date.now() / 1000)],
  );
  if (rows.length !== 1) throw new HttpError(401, "Authentication required");
  return token;
}

export async function revokeRequestSession(
  request: NextRequest,
  config: RuntimeConfig,
): Promise<void> {
  const token = request.cookies.get(config.sessionCookieName)?.value ?? "";
  if (/^[a-f0-9]{64}$/.test(token)) {
    await sql(`DELETE FROM sessions WHERE token_hash = $1`, [sha256(token)]);
  }
}

export async function revokeSession(session: AuthenticatedSession): Promise<void> {
  await sql(`DELETE FROM sessions WHERE token_hash = $1`, [session.tokenHash]);
}

export function dummyPasswordHash(): string {
  return DUMMY_PASSWORD_HASH;
}
