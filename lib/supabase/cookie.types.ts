/** Shape passed by @supabase/ssr to cookie setters (aligned with Next ResponseCookie). */
export type SupabaseCookie = {
  name: string;
  value: string;
  options?: {
    path?: string;
    domain?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none" | boolean;
    expires?: Date;
  };
};
