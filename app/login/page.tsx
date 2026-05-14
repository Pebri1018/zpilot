import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const configError = q.error === "config";
  const authError = q.error === "auth";
  const blockedError = q.error === "blocked";
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] px-6 text-neutral-900 antialiased">
      <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center py-12">

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-white shadow-sm mb-4 overflow-hidden border border-neutral-100">
            <img src="/logo.png" alt="ZPILOT Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-neutral-900">
            ZPILOT
          </h1>
          <p className="mt-2 text-[0.95rem] font-semibold text-neutral-600">
            Find better zones. Drive smarter.
          </p>
          <p className="mt-1 text-[0.8rem] text-neutral-500">
            AI Navigation Intelligence for Drivers.
          </p>
        </div>

        {(!supabaseReady || configError) && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[0.85rem] text-amber-800">
            <p className="font-semibold mb-1">⚠️ Konfigurasi belum lengkap</p>
            <p>Isi variabel Supabase di file .env.local untuk memulai.</p>
          </div>
        )}

        {authError && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[0.85rem] font-medium text-red-700">
            Sesi habis atau akses ditolak. Silakan masuk kembali.
          </div>
        )}

        {blockedError && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[0.85rem] font-medium text-red-700">
            Akun Anda telah dinonaktifkan oleh admin.
          </div>
        )}

        <AuthForm disabled={!supabaseReady} />

        <p className="mt-8 text-center text-[0.78rem] text-neutral-400 leading-relaxed">
          Dengan masuk, kamu menyetujui syarat penggunaan layanan ZPILOT.
        </p>
      </div>
    </div>
  );
}
