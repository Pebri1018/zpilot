import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const configError = q.error === "config";
  const authError = q.error === "auth";
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] px-6 text-neutral-900 antialiased">
      <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center py-12">

        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-neutral-900 shadow-lg mb-4">
            <span className="text-white text-2xl font-black tracking-tighter">Z</span>
          </div>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-neutral-900">
            ZTIPS Pilot
          </h1>
          <p className="mt-2 text-[0.95rem] font-semibold text-neutral-600">
            Hyperlocal Intelligence Dashboard
          </p>
          <p className="mt-1 text-[0.8rem] text-neutral-500">
            Lebih presisi dari sekadar heatmap bawaan aplikator.
          </p>
        </div>

        {/* Config Banner */}
        {(!supabaseReady || configError) && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[0.85rem] text-amber-800">
            <p className="font-semibold mb-1">⚠️ Konfigurasi belum lengkap</p>
            <p>Isi <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di file <code className="bg-amber-100 px-1 rounded">.env.local</code>, lalu restart server.</p>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[0.85rem] font-medium text-red-700">
            Sesi habis atau akses ditolak. Silakan masuk kembali.
          </div>
        )}

        {/* Auth Form Component */}
        <AuthForm disabled={!supabaseReady} />

        <p className="mt-8 text-center text-[0.78rem] text-neutral-400 leading-relaxed">
          Dengan membuat akun, kamu menyetujui syarat penggunaan layanan ZTIPS Pilot.
        </p>
      </div>
    </div>
  );
}
