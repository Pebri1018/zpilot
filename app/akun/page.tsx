import { DriverBottomNav } from "@/components/DriverBottomNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AkunClient } from "@/components/AkunClient";

export const dynamic = "force-dynamic";

export default async function AkunPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nama, kota, platform, driver_id")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] pb-24 text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="pb-6">
          <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Akun</h1>
          <p className="mt-1 text-[0.9rem] text-neutral-500">Profil & Pengaturan</p>
        </header>

        <AkunClient
          email={user.email ?? ""}
          nama={profile?.nama ?? null}
          kota={profile?.kota ?? null}
          platform={profile?.platform ?? "ShopeeFood"}
          driverId={profile?.driver_id ?? null}
        />
      </div>
      <DriverBottomNav />
    </div>
  );
}
