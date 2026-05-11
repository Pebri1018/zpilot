import { DriverBottomNav } from "@/components/DriverBottomNav";
import { LiveDashboard } from "@/components/LiveDashboard";
import { BroadcastCard } from "@/components/BroadcastCard";
import { createClient } from "@/lib/supabase/server";
import { getLatestActiveBroadcast } from "@/app/admin/actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("nama, kota, is_disabled")
    .eq("id", user.id)
    .single();

  if (profile?.is_disabled) {
    await supabase.auth.signOut();
    redirect("/login?error=blocked");
  }

  const broadcast = await getLatestActiveBroadcast();

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f4] pb-24 text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {broadcast && <div className="mb-3"><BroadcastCard broadcast={broadcast} /></div>}
        <LiveDashboard />
      </div>
      <DriverBottomNav />
    </div>
  );
}
