import { redirect } from "next/navigation";
import { verifyAdmin, getBroadcasts } from "./actions";
import { getAllMerchants } from "./actions/signals";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/");

  const broadcasts = await getBroadcasts();
  const initialMerchants = await getAllMerchants();

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Founder Tool</p>
          </div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em]">Intelijen Lapangan</h1>
        </div>

        <AdminClient broadcasts={broadcasts} initialMerchants={initialMerchants} />
      </div>
    </div>
  );
}
