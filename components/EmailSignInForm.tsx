"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  disabled?: boolean;
};

export function EmailSignInForm({ disabled = false }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || !email) return;
    
    setMessage(null);
    setLoading(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error(error.message);
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Link login berhasil dikirim! Silakan periksa email Anda." });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal mengirim link login";
      console.error(e);
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={signIn} className="space-y-4">
      {message?.type === "error" ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          {message.text}
        </p>
      ) : message?.type === "success" ? (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="alert">
          {message.text}
        </p>
      ) : null}
      
      <div>
        <label htmlFor="email" className="sr-only">Alamat Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || disabled}
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading || disabled || !email}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-900 py-4 text-[1.05rem] font-semibold text-white shadow-sm transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-800"
      >
        {disabled
          ? "Konfigurasi .env.local belum lengkap"
          : loading
            ? "Mengirim Link..."
            : "Kirim Link Login"}
      </button>
    </form>
  );
}
