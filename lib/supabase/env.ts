/**
 * Base project URL only — never include /rest/v1 or trailing slashes.
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (!raw) return "";
  let url = raw.replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1\/?$/i, "");
  return url.replace(/\/+$/, "");
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
