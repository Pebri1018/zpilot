import { redirect } from "next/navigation";
import { verifyAdmin, getBroadcasts, createBroadcast, toggleBroadcast, deleteBroadcast } from "./actions";
import type { Broadcast, BroadcastType } from "./actions";

const TYPE_META: Record<BroadcastType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  spot_ramai: {
    label: "Spot Ramai",
    color: "#00A651",
    bg: "#00A65112",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  hindari_area: {
    label: "Hindari Area",
    color: "#EF4444",
    bg: "#EF444412",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  promo_seller: {
    label: "Promo Seller",
    color: "#F97316",
    bg: "#F9731612",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  paket_spx: {
    label: "Paket SPX",
    color: "#3B82F6",
    bg: "#3B82F612",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  cuaca_event: {
    label: "Cuaca / Event",
    color: "#8B5CF6",
    bg: "#8B5CF612",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
};

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/");

  const broadcasts = await getBroadcasts();

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] text-neutral-900 antialiased">
      <div className="mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Admin Panel</p>
          </div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em]">Broadcast</h1>
          <p className="text-[0.9rem] text-neutral-500 mt-1">Kirim saran strategis ke semua driver aktif.</p>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100 mb-8">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400 mb-4">Buat Broadcast Baru</h2>
          <form action={createBroadcast} className="space-y-4">
            <div>
              <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Judul</label>
              <input
                name="title"
                required
                placeholder="cth: Area Malioboro Sedang Padat"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition"
              />
            </div>
            <div>
              <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Pesan</label>
              <textarea
                name="message"
                required
                rows={3}
                placeholder="cth: Banyak event di Malioboro malam ini. Perkiraan order melonjak 2x. Posisikan diri di area Prawirotaman atau Pathuk."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition resize-none"
              />
            </div>
            <div>
              <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Tipe</label>
              <select
                name="type"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-neutral-400 transition"
              >
                <option value="">-- Pilih tipe --</option>
                <option value="spot_ramai">Spot Ramai</option>
                <option value="hindari_area">Hindari Area</option>
                <option value="promo_seller">Promo Seller</option>
                <option value="paket_spx">Paket SPX</option>
                <option value="cuaca_event">Cuaca / Event</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-neutral-900 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-neutral-800"
            >
              Kirim ke Semua Driver
            </button>
          </form>
        </div>

        {/* Broadcast List */}
        <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400 mb-4">
          Riwayat ({broadcasts.length})
        </h2>
        <div className="space-y-3">
          {broadcasts.length === 0 && (
            <p className="text-center text-neutral-400 text-[0.9rem] py-8">Belum ada broadcast.</p>
          )}
          {broadcasts.map((b) => {
            const meta = TYPE_META[b.type];
            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${b.active ? "border-neutral-100" : "opacity-50 border-neutral-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    {b.active && (
                      <span className="text-[0.65rem] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <form action={toggleBroadcast.bind(null, b.id, !b.active)}>
                      <button
                        type="submit"
                        className={`text-[0.7rem] font-bold px-2.5 py-1 rounded-full transition active:scale-95 ${b.active ? "bg-neutral-100 text-neutral-600" : "bg-green-100 text-green-700"}`}
                      >
                        {b.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                    <form action={deleteBroadcast.bind(null, b.id)}>
                      <button
                        type="submit"
                        className="text-[0.7rem] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500 transition active:scale-95"
                      >
                        Hapus
                      </button>
                    </form>
                  </div>
                </div>
                <p className="font-bold text-neutral-900 text-[0.95rem] mt-1">{b.title}</p>
                <p className="text-[0.85rem] text-neutral-500 mt-0.5 leading-relaxed">{b.message}</p>
                <p className="text-[0.7rem] text-neutral-400 mt-2">
                  {new Date(b.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
