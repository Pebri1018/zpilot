import { redirect } from "next/navigation";
import { verifyAdmin, getBroadcasts } from "./actions";
import { getAllMerchants } from "./actions/signals";
import { getAllNgetemSpots } from "./actions/notes";
import { getFeedbackList, getUserList, getAdminStats } from "./actions/admin_data";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/");

  const [broadcasts, initialMerchants, initialSpots, initialUsers, initialFeedback, stats] = await Promise.all([
    getBroadcasts(),
    getAllMerchants(),
    getAllNgetemSpots(),
    getUserList(),
    getFeedbackList(),
    getAdminStats()
  ]);

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Founder Operations</p>
          </div>
          <h1 className="text-[1.8rem] font-black tracking-tight">Intelligence</h1>
        </div>

        <AdminClient 
          broadcasts={broadcasts} 
          initialMerchants={initialMerchants} 
          initialSpots={initialSpots}
          initialUsers={initialUsers}
          initialFeedback={initialFeedback}
          stats={stats}
        />
      </div>
    </div>
  );
}
