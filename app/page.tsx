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
    .select("role, is_disabled")
    .eq("id", user.id)
    .single();

  if (profile?.is_disabled) {
    await supabase.auth.signOut();
    redirect("/login?error=blocked");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/beranda");
  }
}
