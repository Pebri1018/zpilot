import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseCookie } from "@/lib/supabase/cookie.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const LOGIN_PATH = "/login";
const AUTH_CALLBACK_PREFIX = "/auth/callback";
const ONBOARDING_PATH = "/onboarding";

function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith(AUTH_CALLBACK_PREFIX);
}

function isProtectedAppPath(pathname: string): boolean {
  const protectedExact = ["/", "/radar", "/riwayat", "/akun", ONBOARDING_PATH];
  return protectedExact.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    console.error("Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (isProtectedAppPath(pathname) && !isPublicPath(pathname)) {
      return NextResponse.redirect(new URL("/login?error=config", request.url));
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedAppPath(pathname) && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    return NextResponse.redirect(redirectUrl);
  }

  let needsOnboarding = false;
  if (user) {
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("middleware users lookup:", error.message);
      needsOnboarding = true;
    } else {
      needsOnboarding = !data?.onboarding_completed;
    }
  }

  if (user && pathname === LOGIN_PATH) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = needsOnboarding ? ONBOARDING_PATH : "/";
    return NextResponse.redirect(redirectUrl);
  }

  if (
    user &&
    needsOnboarding &&
    pathname !== ONBOARDING_PATH &&
    !pathname.startsWith(AUTH_CALLBACK_PREFIX)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ONBOARDING_PATH;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !needsOnboarding && pathname === ONBOARDING_PATH) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
