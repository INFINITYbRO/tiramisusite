import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./config";
import { ServiceUnavailableError } from "./errors";

const schemaPromises = new Map<string, Promise<void>>();

async function rawQuery<T>(
  connectionString: string,
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const queryFunction = neon(connectionString);
    return (await queryFunction.query(query, params)) as T[];
  } catch {
    throw new ServiceUnavailableError("Database is temporarily unavailable");
  }
}

async function initializeSchema(connectionString: string): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      username varchar(16) NOT NULL,
      username_key varchar(16) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at bigint NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash char(64) PRIMARY KEY,
      csrf_hash char(64) NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at bigint NOT NULL,
      expires_at bigint NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS sessions_user_created_idx
      ON sessions(user_id, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS skins (
      username_key varchar(16) PRIMARY KEY,
      username varchar(16) NOT NULL,
      user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      model varchar(7) NOT NULL CHECK (model IN ('default', 'slim')),
      blob_url text NOT NULL,
      hash char(64) NOT NULL,
      updated_at bigint NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      rate_key char(64) PRIMARY KEY,
      window_started_at bigint NOT NULL,
      hits integer NOT NULL
    )`,
  ];
  for (const statement of statements) {
    await rawQuery(connectionString, statement);
  }
}

async function ensureSchema(connectionString: string): Promise<void> {
  let promise = schemaPromises.get(connectionString);
  if (!promise) {
    promise = initializeSchema(connectionString).catch((error) => {
      schemaPromises.delete(connectionString);
      throw error;
    });
    schemaPromises.set(connectionString, promise);
  }
  await promise;
}

export async function sql<T>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  const connectionString = getDatabaseUrl();
  await ensureSchema(connectionString);
  return rawQuery<T>(connectionString, query, params);
}

export function resetSchemaCacheForTests(): void {
  schemaPromises.clear();
}
