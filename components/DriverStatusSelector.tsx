"use client";

import { useLocation } from "@/hooks/useLocation";

const STATUS_OPTIONS = [
  { id: "Cari Spot", label: "Cari Spot", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "Ngetem", label: "Ngetem", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "Antar", label: "Antar", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "Istirahat", label: "Istirahat", color: "bg-neutral-100 text-neutral-600 border-neutral-200" },
];

export function DriverStatusSelector() {
  const { status, setStatus, loading } = useLocation();

  return (
    <div className="mb-6">
      <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3 ml-2">
        Status Saat Ini
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setStatus(opt.id)}
              disabled={loading}
              className={`shrink-0 px-4 py-2 rounded-full border text-[0.8rem] font-bold transition-all active:scale-95 ${
                isActive 
                  ? `${opt.color} shadow-sm ring-1 ring-inset ring-black/5` 
                  : "bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
