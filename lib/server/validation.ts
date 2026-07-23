export type SkinModel = "default" | "slim";

export function isValidUsername(username: unknown): username is string {
  return (
    typeof username === "string" && /^[A-Za-z0-9_]{3,16}$/.test(username)
  );
}

export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

export function isSkinModel(value: unknown): value is SkinModel {
  return value === "default" || value === "slim";
}
