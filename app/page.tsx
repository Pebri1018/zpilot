import { DriverBottomNav } from "@/components/DriverBottomNav";
import { LiveDashboard } from "@/components/LiveDashboard";
import { BroadcastCard } from "@/components/BroadcastCard";
import { createClient } from "@/lib/supabase/server";
import { getLatestActiveBroadcast } from "@/app/admin/actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nama, kota, is_disabled")
    .eq("id", user.id)
    .single();

  if (profile?.is_disabled) {
    await supabase.auth.signOut();
    redirect("/login?error=blocked");
  }

  const nama = profile?.nama || "Driver";
  const kota = profile?.kota || "Yogyakarta";
  const broadcast = await getLatestActiveBroadcast();

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] pb-24 text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[1.8rem] font-bold tracking-[-0.02em] mb-1">Halo {nama}</h1>
        <p className="text-[1.05rem] text-neutral-500 mb-6">{kota}</p>

        {broadcast && <BroadcastCard broadcast={broadcast} />}

        <LiveDashboard />
      </div>

      <DriverBottomNav />
    </div>
  );
}
