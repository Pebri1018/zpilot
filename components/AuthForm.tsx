"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createUserProfile, checkEmailExists } from "@/app/login/actions";

type Props = {
  disabled?: boolean;
};

type Tab = "masuk" | "daftar";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email atau kata sandi salah. Coba login dengan Google.",
  "Email not confirmed": "Email belum dikonfirmasi. Periksa kotak masuk Anda.",
  "User already registered": "Email sudah terdaftar. Silakan masuk.",
  "Password should be at least 6 characters": "Password minimal 6 karakter.",
  "signup is disabled": "Pendaftaran dinonaktifkan sementara oleh admin.",
  "Email signups are disabled": "Pendaftaran via email belum diaktifkan. Hubungi admin.",
  "over_email_send_rate_limit": "Terlalu banyak percobaan. Tunggu beberapa menit.",
  "Email belum terdaftar": "Email belum terdaftar. Silakan daftar akun baru.",
};

function translateError(msg: string): string {
  for (const key of Object.keys(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return ERROR_MAP[key];
  }
  return msg;
}

export function AuthForm({ disabled = false }: Props) {
  const [tab, setTab] = useState<Tab>("masuk");
  const [isSuccess, setIsSuccess] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kota, setKota] = useState("Yogyakarta");
  const [driverId, setDriverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  function switchTab(t: Tab) {
    setTab(t);
    setMessage(null);
    setPassword("");
  }

  async function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setMessage(null);
    setLoading(true);
    try {
      // 1. Check if email exists in public.users first for better feedback
      const check = await checkEmailExists(email);
      if (check.exists === false) {
        setMessage({ type: "error", text: ERROR_MAP["Email belum terdaftar"] });
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "error", text: translateError(error.message) });
      } else {
        // Fetch user role
        const { data: { user: authedUser } } = await supabase.auth.getUser();
        if (authedUser) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", authedUser.id)
            .maybeSingle();
          
          if (userData?.role === "admin") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/beranda";
          }
        } else {
          window.location.href = "/beranda";
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Login gagal. Coba buka menggunakan Chrome atau login dengan Google." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDaftar(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nama },
        },
      });

      if (error) {
        setMessage({ type: "error", text: translateError(error.message) });
        return;
      }

      const newUserId = data.user?.id;
      if (!newUserId) {
        setMessage({ type: "error", text: "Gagal membuat akun. Coba lagi." });
        return;
      }

      // Insert profile immediately (service role bypasses RLS)
      const result = await createUserProfile(newUserId, { nama, kota, driverId, platform: "Shopee", email });
      if (result.error) {
        setMessage({ type: "error", text: `Profil gagal disimpan: ${result.error}` });
        return;
      }

      // If auto-logged in (no confirm needed), just redirect
      if (data.session) {
        // Fetch user role for new signup (usually 'user' but better be safe)
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", newUserId)
          .maybeSingle();

        if (userData?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/beranda";
        }
      } else {
        // Show confirmation screen
        setIsSuccess(true);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Pendaftaran gagal. Coba buka menggunakan Chrome atau login dengan Google." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (disabled) return;
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        setMessage({ type: "error", text: translateError(error.message) });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Login gagal. Coba buka menggunakan Chrome." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Google Login Button */}
      {!isSuccess && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || disabled}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] font-bold text-neutral-800 shadow-sm transition-all active:scale-[0.98] hover:bg-neutral-50 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Lanjut dengan Google
          </button>
          
          <div className="relative mt-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative bg-[#f7f7f8] px-4 text-[0.8rem] text-neutral-400 font-medium">
              ATAU GUNAKAN EMAIL
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      {!isSuccess && (
        <div className="flex rounded-2xl bg-neutral-100 p-1 mb-8">
          {(["masuk", "daftar"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-xl py-2.5 text-[0.95rem] font-semibold transition-all duration-200 ${
                tab === t
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t === "masuk" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>
      )}

      {/* Error / Success Banner */}
      {message && (
        <div
          className={`mb-5 rounded-2xl px-4 py-3 text-[0.9rem] font-medium ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* MASUK FORM */}
      {tab === "masuk" && (
        <form onSubmit={handleMasuk} className="space-y-4">
          <div>
            <label htmlFor="masuk-email" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Email
            </label>
            <input
              id="masuk-email"
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || disabled}
              className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
            />
          </div>

          <div>
            <label htmlFor="masuk-password" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="masuk-password"
                type={showPass ? "text" : "password"}
                required
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || disabled}
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pr-12 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || disabled || !email || !password}
            className="mt-2 flex w-full items-center justify-center rounded-2xl bg-neutral-900 py-4 text-[1.05rem] font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-neutral-800"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      )}

      {/* DAFTAR FORM (Single Flow) */}
      {tab === "daftar" && !isSuccess && (
        <form onSubmit={handleDaftar} className="space-y-4 animate-in fade-in duration-300">
          <div>
            <label htmlFor="daftar-email" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Email
            </label>
            <input
              id="daftar-email"
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || disabled}
              className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
            />
          </div>

          <div>
            <label htmlFor="daftar-password" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="daftar-password"
                type={showPass ? "text" : "password"}
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || disabled}
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pr-12 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="daftar-nama" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Nama Panggilan
            </label>
            <input
              id="daftar-nama"
              type="text"
              required
              placeholder="cth: Budi"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={loading || disabled}
              className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="daftar-kota" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
                Area (Kota)
              </label>
              <input
                id="daftar-kota"
                type="text"
                required
                placeholder="Yogyakarta"
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                disabled={loading || disabled}
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-4 text-[0.95rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
              />
            </div>
            <div>
              <label htmlFor="daftar-driverid" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
                ID Driver <span className="text-neutral-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="daftar-driverid"
                type="text"
                placeholder="DRV-123"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                disabled={loading || disabled}
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-4 text-[0.95rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || disabled || !email || !password || !nama || !kota}
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-neutral-900 py-4 text-[1.05rem] font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-neutral-800"
          >
            {loading ? "Memproses..." : "Lanjutkan"}
          </button>
        </form>
      )}

      {/* SUCCESS CONFIRMATION SCREEN */}
      {isSuccess && (
        <div className="text-center animate-in zoom-in-95 duration-300 py-6 bg-white rounded-3xl border border-neutral-100 shadow-sm p-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[1.5rem] font-bold text-neutral-900 mb-2">Hampir selesai</h2>
          <p className="text-[0.95rem] text-neutral-500 leading-relaxed mb-8">
            Silakan cek email <strong className="text-neutral-800">{email}</strong> untuk konfirmasi akun, lalu kembali ke aplikasi.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              switchTab("masuk");
            }}
            className="w-full flex items-center justify-center rounded-2xl bg-neutral-900 py-4 text-[1.05rem] font-bold text-white shadow-sm transition-all active:scale-[0.98] hover:bg-neutral-800"
          >
            Saya Sudah Konfirmasi
          </button>
        </div>
      )}

      {/* CHROME RECOMMENDATION BANNER */}
      {!isSuccess && (
        <div className="mt-8 rounded-2xl bg-blue-50/50 border border-blue-100/50 px-4 py-3.5 text-center flex flex-col gap-1 items-center justify-center">
          <p className="text-[0.8rem] font-medium text-blue-800/80">
            📱 Mengalami error atau loading terus?
          </p>
          <p className="text-[0.75rem] text-blue-700/70">
            Disarankan menggunakan browser <strong className="font-bold">Google Chrome</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
