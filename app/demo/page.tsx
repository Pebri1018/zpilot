import { LiveDashboard } from "@/components/LiveDashboard";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { BroadcastCard } from "@/components/BroadcastCard";
import { getLatestActiveBroadcast } from "@/app/admin/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const broadcast = await getLatestActiveBroadcast();

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f4] pb-24 text-neutral-900 antialiased relative">
      {/* Demo Banner */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center text-[0.75rem] font-bold sticky top-0 z-50 flex items-center justify-between">
        <span>DEMO MODE — Read Only</span>
        <Link href="/login" className="bg-white text-blue-600 px-3 py-1 rounded-lg">Masuk / Daftar</Link>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        {broadcast && <div className="mb-3"><BroadcastCard broadcast={broadcast} /></div>}
        
        {/* Pass isDemo to disable interactions */}
        <LiveDashboard isDemo={true} />
      </div>

      <DriverBottomNav isDemo={true} />

      {/* Glass Overlay to indicate demo/non-interactive areas if needed */}
      {/* For now we'll handle it inside components */}
    </div>
  );
}
