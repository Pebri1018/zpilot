"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  disabled?: boolean;
};

type Tab = "masuk" | "daftar";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email atau password salah. Coba lagi.",
  "Email not confirmed": "Email belum dikonfirmasi. Periksa kotak masuk Anda.",
  "User already registered": "Email sudah terdaftar. Silakan masuk.",
  "Password should be at least 6 characters": "Password minimal 6 karakter.",
  "signup is disabled": "Pendaftaran sementara dinonaktifkan.",
};

function translateError(msg: string): string {
  for (const key of Object.keys(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return ERROR_MAP[key];
  }
  return msg;
}

export function AuthForm({ disabled = false }: Props) {
  const [tab, setTab] = useState<Tab>("masuk");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
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
    if (password !== konfirmasi) {
      setMessage({ type: "error", text: "Password dan konfirmasi tidak cocok." });
      return;
    }
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: translateError(error.message) });
      } else if (data.session) {
        // Auto-confirmed (email confirmation disabled in Supabase)
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage({
          type: "success",
          text: "Akun berhasil dibuat! Silakan masuk sekarang.",
        });
        switchTab("masuk");
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPass ? "🙈" : "👁️"}
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

      {/* DAFTAR FORM */}
      {tab === "daftar" && (
        <form onSubmit={handleDaftar} className="space-y-4">
          <div>
            <label htmlFor="daftar-nama" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Nama
            </label>
            <input
              id="daftar-nama"
              type="text"
              required
              placeholder="Nama lengkap kamu"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={loading || disabled}
              className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
            />
          </div>

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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="daftar-konfirmasi" className="block text-[0.85rem] font-semibold text-neutral-600 mb-1.5">
              Konfirmasi Password
            </label>
            <input
              id="daftar-konfirmasi"
              type={showPass ? "text" : "password"}
              required
              placeholder="Ulangi password"
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              disabled={loading || disabled}
              className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10 disabled:opacity-50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || disabled || !nama || !email || !password || !konfirmasi}
            className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#00A651] py-4 text-[1.05rem] font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ boxShadow: "0 8px 24px -6px rgba(0,166,81,0.35)" }}
          >
            {loading ? "Membuat akun..." : "Buat Akun Gratis"}
          </button>
        </form>
      )}
    </div>
  );
}
