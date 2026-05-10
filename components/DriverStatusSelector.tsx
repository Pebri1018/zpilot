"use client";

import { useLocation } from "@/hooks/useLocation";
import { useLanguage } from "@/context/LanguageContext";

export function DriverStatusSelector() {
  const { status, setStatus, loading } = useLocation();
  const { lang, t } = useLanguage();

  const STATUS_OPTIONS = [
    { id: "Ngetem", label: t("ngetem"), color: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: "Antar", label: t("antar"), color: "bg-orange-100 text-orange-700 border-orange-200" },
    { id: "Offline", label: t("offline"), color: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3 ml-2">
        {lang === "ID" ? "Status Saat Ini" : "Current Status"}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
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
