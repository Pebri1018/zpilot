"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

import { useState } from "react";

export function DriverBottomNav({ isDemo = false }: { isDemo?: boolean }) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { 
      href: "/beranda", 
      label: t("home"),
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      href: "/radar", 
      label: t("radar"),
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      href: "/tren", 
      label: "Tren",
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      href: "/akun", 
      label: t("account"),
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/90 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
        aria-label="Menu utama"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-1">
          {items.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={isDemo && href !== "/demo" ? "#" : href}
                onClick={isDemo && href !== "/demo" ? (e) => { e.preventDefault(); setShowPremiumModal(true); } : undefined}
                className={`py-2 flex flex-col items-center justify-center transition-colors ${
                  active ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500 active:text-neutral-600 dark:active:text-neutral-400"
                }`}
              >
                {icon}
                <span className="text-[0.65rem] font-medium leading-tight sm:text-[0.7rem]">{label}</span>
                <span
                  className={`mx-auto mt-1 block h-0.5 w-4 rounded-full transition-colors ${
                    active ? "bg-neutral-900 dark:bg-white" : "bg-transparent"
                  }`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PREMIUM MODAL (Ensured Center Positioning) */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
          <div 
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-[1.5rem] font-black text-neutral-900 leading-tight mb-3">Akses Terbatas</h3>
            <p className="text-[0.95rem] text-neutral-500 font-medium leading-relaxed mb-8">
              Masuk untuk aktifkan fitur lengkap ZPILOT dan pantau radar secara real-time.
            </p>
            <div className="space-y-3">
              <Link href="/login" className="block w-full bg-blue-600 text-white text-[1rem] font-bold py-4 rounded-2xl text-center shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                Masuk Sekarang
              </Link>
              <button onClick={() => setShowPremiumModal(false)} className="block w-full text-neutral-400 text-[0.85rem] font-bold py-2">
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
