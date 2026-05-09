import { LogoutButton } from "@/components/LogoutButton";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  const nama = profile?.nama;
  const kota = profile?.kota ?? "—";
  const platform = profile?.platform ?? "ShopeeFood";
  const driverId = profile?.driver_id?.trim() || "—";
  const email = user.email ?? "—";

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] pb-24 text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="pb-8">
          <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Akun</h1>
          <p className="mt-1 text-[0.95rem] text-neutral-600">Profil driver</p>
        </header>

        <div className="divide-y divide-neutral-200/90 rounded-2xl bg-white px-5 py-1 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
          <div className="flex flex-col gap-1 py-5">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Email
            </span>
            <span className="break-all text-[1.05rem] font-medium text-neutral-900">{email}</span>
          </div>
          <div className="flex flex-col gap-1 py-5">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Nama
            </span>
            {nama ? (
              <span className="text-[1.1rem] font-medium text-neutral-900">{nama}</span>
            ) : (
              <Link href="/onboarding" className="mt-1 inline-flex w-fit items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-[0.9rem] font-semibold text-white transition active:scale-[0.98]">
                Lengkapi Profil
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-1 py-5">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Kota
            </span>
            <span className="text-[1.1rem] font-medium text-neutral-900">{kota}</span>
          </div>
          <div className="flex flex-col gap-1 py-5">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Platform
            </span>
            <span className="text-[1.1rem] font-medium text-neutral-900">{platform}</span>
          </div>
          <div className="flex flex-col gap-1 py-5">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400">
              ID Driver
            </span>
            <span className="font-mono text-[1.05rem] font-medium tabular-nums text-neutral-600">
              {driverId}
            </span>
          </div>
        </div>

        <LogoutButton />
      </div>

      <DriverBottomNav />
    </div>
  );
}
