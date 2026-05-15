import { DriverBottomNav } from "@/components/DriverBottomNav";
import { LiveDashboard } from "@/components/LiveDashboard";
import { BroadcastCard } from "@/components/BroadcastCard";
import { createClient } from "@/lib/supabase/server";
import { getLatestActiveBroadcast } from "@/app/admin/actions";
import { redirect } from "next/navigation";

export default async function BerandaPage() {
  const supabase = await createClient();
  // Parallelize fetches for speed
  const [userResult, broadcast] = await Promise.all([
    supabase.auth.getUser(),
    getLatestActiveBroadcast()
  ]);

  const user = userResult.data.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("nama, kota, is_disabled, role")
    .eq("id", user.id)
    .single();

  if (profile?.is_disabled) {
    await supabase.auth.signOut();
    redirect("/login?error=blocked");
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f4] dark:bg-neutral-950 pb-24 text-neutral-900 dark:text-neutral-100 antialiased">
      <div className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {broadcast && <div className="mb-3"><BroadcastCard broadcast={broadcast} /></div>}
        <LiveDashboard />
      </div>
      <DriverBottomNav />
    </div>
  );
}
