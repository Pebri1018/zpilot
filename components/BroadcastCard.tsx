import type { Broadcast, BroadcastType } from "@/app/admin/actions";

const TYPE_META: Record<BroadcastType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  spot_ramai: {
    label: "Spot Ramai",
    color: "#00A651",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  hindari_area: {
    label: "Hindari Area",
    color: "#EF4444",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  promo_seller: {
    label: "Promo Seller",
    color: "#F97316",
    bg: "#fff7ed",
    border: "#fed7aa",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  paket_spx: {
    label: "Paket SPX",
    color: "#3B82F6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  cuaca_event: {
    label: "Cuaca / Event",
    color: "#8B5CF6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
};

type Props = {
  broadcast: Broadcast;
};

export function BroadcastCard({ broadcast }: Props) {
  const meta = TYPE_META[broadcast.type];

  return (
    <div
      className="rounded-3xl px-5 py-5 border transition-all mb-6"
      style={{ backgroundColor: meta.bg, borderColor: meta.border }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: meta.color }}>{meta.icon}</span>
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.15em]" style={{ color: meta.color }}>
          {meta.label}
        </p>
        {/* Live pulse */}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: meta.color }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: meta.color }}></span>
          </span>
          <span className="text-[0.65rem] font-bold" style={{ color: meta.color }}>LIVE</span>
        </span>
      </div>

      {/* Title */}
      <p className="text-[1.15rem] font-extrabold text-neutral-900 leading-tight tracking-[-0.01em]">
        {broadcast.title}
      </p>

      {/* Message */}
      <p className="mt-2 text-[0.9rem] text-neutral-600 leading-relaxed font-medium">
        {broadcast.message}
      </p>

      {/* Timestamp */}
      <p className="mt-3 text-[0.7rem] font-semibold text-neutral-400">
        Dikirim {new Date(broadcast.created_at).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </div>
  );
}
