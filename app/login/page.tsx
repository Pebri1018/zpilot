import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { EmailSignInForm } from "@/components/EmailSignInForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const configError = q.error === "config";
  const authError = q.error === "auth";

  const supabaseReady = isSupabaseConfigured();

  const showConfigBanner = !supabaseReady || configError;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] px-6 pt-[max(3rem,env(safe-area-inset-top))] text-neutral-900 antialiased">
      <div className="mx-auto w-full max-w-sm flex-1">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em]">ZTIPS Pilot</h1>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-neutral-600">
          Your AI Copilot for ShopeeFood Drivers
        </p>

        {showConfigBanner ? (
          <div className="mt-6 space-y-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
            <p>Konfigurasi Supabase belum lengkap.</p>
            <ol className="list-decimal space-y-1 pl-4 text-[0.85rem] font-normal leading-relaxed">
              <li>
                Salin <code className="rounded bg-amber-100/80 px-1">.env.example</code> ke{" "}
                <code className="rounded bg-amber-100/80 px-1">.env.local</code> di folder proyek.
              </li>
              <li>
                Isi <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
                <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dari
                Supabase → Project Settings → API.
              </li>
              <li>Hentikan lalu jalankan lagi <code className="rounded bg-amber-100/80 px-1">npm run dev</code>.</li>
            </ol>
          </div>
        ) : null}
        {authError ? (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            Masuk gagal. Silakan coba lagi.
          </p>
        ) : null}

        <div className="mt-16">
          <EmailSignInForm disabled={!supabaseReady} />
          {/* <GoogleSignInButton disabled={!supabaseReady} /> */}
        </div>

        <p className="mt-8 text-center text-[0.85rem] text-neutral-400">
          Dengan masuk, Anda menyetujui penggunaan akun untuk layanan ZTIPS Pilot.
        </p>
      </div>
    </div>
  );
}
