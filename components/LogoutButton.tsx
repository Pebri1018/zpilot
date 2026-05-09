"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="mt-8 w-full rounded-2xl border border-neutral-200 bg-white py-4 text-[1.05rem] font-semibold text-neutral-800 transition enabled:active:opacity-90 disabled:opacity-50"
    >
      {loading ? "Keluar…" : "Keluar"}
    </button>
  );
}
