"use client";

import { DriverBottomNav } from "@/components/DriverBottomNav";
import { LiveDashboard } from "@/components/LiveDashboard";
import { BroadcastCard } from "@/components/BroadcastCard";
import { createClient } from "@/lib/supabase/client";
import { getLatestActiveBroadcast } from "@/app/admin/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BerandaPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch non-blocking data
      getLatestActiveBroadcast().then(setBroadcast);

      // Check disabled status in background
      supabase
        .from("users")
        .select("is_disabled")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_disabled) {
            supabase.auth.signOut().then(() => router.push("/login?error=blocked"));
          }
        });
    }
    init();
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f4] dark:bg-neutral-950 pb-24 text-neutral-900 dark:text-neutral-100 antialiased">
      <div className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {broadcast && <div className="mb-3 animate-in fade-in slide-in-from-top-2"><BroadcastCard broadcast={broadcast} /></div>}
        <LiveDashboard />
      </div>
      <DriverBottomNav />
    </div>
  );
}
