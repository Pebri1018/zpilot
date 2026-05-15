"use client";

import { DriverBottomNav } from "@/components/DriverBottomNav";
import { createClient } from "@/lib/supabase/client";
import { AkunClient } from "@/components/AkunClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AkunPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      const [pRes, fRes] = await Promise.all([
        supabase.from("users").select("nama, kota, platform, driver_id, ztips_id, role").eq("id", u.id).maybeSingle(),
        supabase.from("feedback").select("*").eq("user_id", u.id).order("created_at", { ascending: false })
      ]);

      setProfile(pRes.data);
      setFeedback(fRes.data || []);
      setLoading(false);
    }
    init();
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] pb-24 text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="pb-6">
          <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Akun</h1>
          <p className="mt-1 text-[0.9rem] text-neutral-500">Profil & Pengaturan</p>
        </header>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-neutral-200 rounded-3xl" />
            <div className="h-40 bg-neutral-200 rounded-3xl" />
          </div>
        ) : (
          <AkunClient
            email={user?.email ?? ""}
            nama={profile?.nama ?? null}
            kota={profile?.kota ?? null}
            platform={profile?.platform ?? "ShopeeFood"}
            driverId={profile?.driver_id ?? null}
            zpilotId={profile?.ztips_id ?? null}
            role={profile?.role ?? "driver"}
            feedback={feedback}
          />
        )}
      </div>
      <DriverBottomNav />
    </div>
  );
}
