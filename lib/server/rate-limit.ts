import { NextRequest } from "next/server";
import { sha256 } from "./crypto";
import { sql } from "./db";
import { HttpError } from "./errors";
import { clientAddress } from "./http";

interface RateLimitRow {
  hits: string;
  window_started_at: string;
}

export async function enforceRateLimit(
  request: NextRequest,
  scope: string,
  maximum: number,
  windowSeconds: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const rateKey = sha256(`${scope}:${clientAddress(request)}`);
  const [row] = await sql<RateLimitRow>(
    `INSERT INTO rate_limits(rate_key, window_started_at, hits)
     VALUES ($1, $2, 1)
     ON CONFLICT (rate_key) DO UPDATE SET
       hits = CASE
         WHEN rate_limits.window_started_at <= $3 THEN 1
         ELSE rate_limits.hits + 1
       END,
       window_started_at = CASE
         WHEN rate_limits.window_started_at <= $3 THEN $2
         ELSE rate_limits.window_started_at
       END
     RETURNING hits, window_started_at`,
    [rateKey, now, now - windowSeconds],
  );
  const hits = Number(row?.hits ?? maximum + 1);
  const startedAt = Number(row?.window_started_at ?? now);
  if (hits > maximum) {
    const retryAfter = Math.max(1, startedAt + windowSeconds - now);
    throw new HttpError(429, "Too many requests; try again later", {
      "Retry-After": String(retryAfter),
    });
  }
}
