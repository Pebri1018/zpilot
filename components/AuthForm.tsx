"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createUserProfile } from "@/app/login/actions";

type Props = {
  disabled?: boolean;
};

type Tab = "masuk" | "daftar";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email atau password salah. Coba lagi.",
  "Email not confirmed": "Email belum dikonfirmasi. Periksa kotak masuk Anda.",
  "User already registered": "Email sudah terdaftar. Silakan masuk.",
  "Password should be at least 6 characters": "Password minimal 6 karakter.",
  "signup is disabled": "Pendaftaran dinonaktifkan sementara oleh admin.",
  "Email signups are disabled": "Pendaftaran via email belum diaktifkan. Hubungi admin.",
  "over_email_send_rate_limit": "Terlalu banyak percobaan. Tunggu beberapa menit.",
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
    setKonfirmasi("");
  }

  async function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "error", text: translateError(error.message) });
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan. Coba lagi." });
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
      const result = await createUserProfile(newUserId, { nama, kota, driverId, platform: "ShopeeFood" });
      if (result.error) {
        setMessage({ type: "error", text: `Profil gagal disimpan: ${result.error}` });
        return;
      }

      // If auto-logged in (no confirm needed), just redirect
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        // Show confirmation screen
        setIsSuccess(true);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="w-full">
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
              : "bg-green-50 text-green-700 border border-green-100"
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
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
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
    </div>
  );
}
