import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { verifyAdmin } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

// We use service client to bypass RLS and fetch all user data
function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function FounderPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/");

  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // 1. Total Registered Drivers
  const { count: totalDrivers } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true });

  // 2. Active Today (from daily_sessions)
  const { data: activeSessions } = await supabase
    .from("daily_sessions")
    .select("active_minutes, last_known_area")
    .eq("date", today);

  const activeToday = activeSessions?.length || 0;
  
  // 3. Avg Active Time
  const totalMinutes = activeSessions?.reduce((acc, s) => acc + (s.active_minutes || 0), 0) || 0;
  const avgActiveMinutes = activeToday > 0 ? Math.round(totalMinutes / activeToday) : 0;
  const avgHours = (avgActiveMinutes / 60).toFixed(1);

  // 4. Popular Areas (simple aggregation)
  const areaCounts: Record<string, number> = {};
  if (activeSessions) {
    for (const s of activeSessions) {
      if (s.last_known_area) {
        areaCounts[s.last_known_area] = (areaCounts[s.last_known_area] || 0) + 1;
      }
    }
  }
  const popularAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Founder Panel</p>
            </div>
            <Link href="/admin" className="text-[0.75rem] font-bold text-blue-600">Ke Admin Broadcast</Link>
          </div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em]">Analytics</h1>
          <p className="text-[0.9rem] text-neutral-500 mt-1">Pantau pemakaian harian (Daily Usefulness).</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400 mb-1">Total Driver</p>
            <p className="text-[2rem] font-extrabold text-neutral-900">{totalDrivers || 0}</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400 mb-1">Aktif Hari Ini</p>
            <p className="text-[2rem] font-extrabold text-blue-600">{activeToday}</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 col-span-2 flex items-center justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400 mb-1">Rata-rata Waktu Aktif</p>
              <div className="flex items-baseline gap-1">
                <p className="text-[2rem] font-extrabold text-green-600">{avgHours}</p>
                <span className="text-[1rem] font-bold text-neutral-400">Jam / Driver</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Areas */}
        <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400 mb-4">
          Area Terpopuler Hari Ini
        </h2>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 space-y-4">
          {popularAreas.length === 0 ? (
            <p className="text-[0.85rem] text-neutral-400 text-center py-2">Belum ada data area hari ini.</p>
          ) : (
            popularAreas.map(([area, count], idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[0.95rem] font-bold text-neutral-800 truncate pr-4">{area}</span>
                <span className="text-[0.8rem] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg shrink-0">
                  {count} Driver
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
