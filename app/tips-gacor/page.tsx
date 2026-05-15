"use client";

import { useState } from "react";
import Link from "next/link";
import { DriverBottomNav } from "@/components/DriverBottomNav";

interface TipSection {
  id: string;
  title: string;
  category: "Akun" | "Lapangan" | "Zona" | "Performa" | "Radar";
  icon: React.ReactNode;
  content: string[];
  note?: string;
  badge?: string;
  type?: "normal" | "warning";
  legend?: { color: string; label: string }[];
}

const TIPS_DATA: TipSection[] = [
  {
    id: "akun-aktif",
    title: "Biar Akun Tetap Enak Narik",
    category: "Akun",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    content: [
      "Pastikan status driver selalu Online kalau siap narik",
      "Aktifkan Auto Accept biar gak telat nyocol orderan",
      "Saldo dompet jangan terlalu tipis, amanin minimal ±50rb",
      "Jangan terlalu sering cancel atau skip order sembarangan",
      "Jaga rating tetap bagus biar performa akun stabil",
      "Cek berkali-kali pastikan akun gak kena pembatasan sementara"
    ],
    note: "Performa akun tetap jadi salah satu faktor penting pembagian order.",
    badge: "DRIVER NOTE"
  },
  {
    id: "pola-gacor",
    title: "Pola Driver yang Sering Lebih Gacor",
    category: "Lapangan",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    content: [
      "Jangan terlalu lama diem di satu spot kalau udah terasa 'mati'",
      "Driver yang aktif muter biasanya lebih cepat dapet movement/pancingan",
      "Cari area dekat merchant aktif, sering lebih bagus daripada sekadar rame driver",
      "Jam makan siang dan malam punya pola berbeda, harus pinter bagi waktu",
      "Area kampus, kos, dan perkantoran punya peak time sendiri (pagi/sore)"
    ],
    badge: "LIVE INSIGHT"
  },
  {
    id: "pindah-zona",
    title: "Kapan Harus Pindah Zona?",
    category: "Zona",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    content: [
      "Sudah idle terlalu lama tanpa ada tanda-tanda orderan",
      "Jumlah driver sekitar makin numpuk tapi orderan dikit",
      "Merchant di area tersebut mulai kelihatan sepi",
      "Tidak ada pergerakan (movement) order masuk ke driver lain",
      "Zona lain terlihat lebih aktif atau hijau di radar ZPILOT"
    ],
    badge: "SEPI / NORMAL / RAMAI"
  },
  {
    id: "hal-seret",
    title: "Hal yang Sering Bikin Seret",
    category: "Performa",
    type: "warning",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    content: [
      "Terlalu sering nolak (skip) orderan yang masuk",
      "Cancel order berlebihan tanpa alasan mendesak",
      "GPS kurang akurat atau sinyal HP bermasalah",
      "Koneksi internet lemot atau kuota sekarat",
      "Status Online tapi sebenarnya lagi istirahat (bikin sistem bingung)",
      "Aplikasi driver belum update ke versi terbaru",
      "HP terlalu berat gara-gara banyak aplikasi background",
      "Menggunakan Fake GPS atau tools ilegal (sangat berisiko!)"
    ],
    note: "Fake GPS bisa menyebabkan akun terkena sanksi atau blokir permanen."
  },
  {
    id: "baca-radar",
    title: "Cara Baca Radar ZPILOT",
    category: "Radar",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    content: [
      "Warna Hijau: Peluang dapet order bagus, persaingan masih oke",
      "Warna Orange: Area mulai ramai, siap-siap gesit",
      "Warna Merah: Sangat ramai dan kompetitif, butuh performa akun prima",
      "Jangan cuma liat keramaian driver, liat merchant yang aktif",
      "Driver numpuk di satu titik belum tentu bikin area itu gacor"
    ],
    legend: [
      { color: "bg-emerald-500", label: "Peluang Bagus" },
      { color: "bg-orange-500", label: "Mulai Ramai" },
      { color: "bg-red-500", label: "Sangat Ramai" }
    ],
    badge: "RADAR INFO"
  }
];

export default function TipsGacorPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [expandedId, setExpandedId] = useState<string | null>("akun-aktif");

  const categories = ["Semua", "Akun", "Lapangan", "Zona", "Performa", "Radar"];

  const filteredTips = TIPS_DATA.filter(tip => {
    const matchesSearch = tip.title.toLowerCase().includes(search.toLowerCase()) || 
                         tip.content.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "Semua" || tip.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] pb-24 text-neutral-900 antialiased">
      {/* Header */}
      <div className="bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/akun" className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 active:scale-95 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-[1.35rem] font-black tracking-tight text-neutral-900 leading-none">Tips Gacor</h1>
            <p className="text-[0.75rem] font-bold text-blue-600 uppercase tracking-widest mt-1.5">Panduan & Insight Lapangan</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            placeholder="Cari tips atau panduan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-50 border-none rounded-2xl py-4 pl-11 pr-4 text-[0.95rem] font-medium placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-5 px-5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-[0.85rem] font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-4 max-w-md mx-auto">
        {filteredTips.length > 0 ? (
          filteredTips.map((tip) => (
            <div 
              key={tip.id}
              className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                tip.type === "warning" 
                ? "bg-orange-50/50 border-orange-100" 
                : "bg-white border-neutral-100"
              } ${expandedId === tip.id ? "ring-2 ring-blue-500/10 shadow-xl shadow-blue-900/5" : "shadow-sm"}`}
            >
              {/* Card Header */}
              <button 
                onClick={() => setExpandedId(expandedId === tip.id ? null : tip.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    tip.type === "warning" ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="text-[0.95rem] font-black text-neutral-800 leading-tight">{tip.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[0.6rem] font-black uppercase tracking-wider ${
                        tip.type === "warning" ? "text-orange-500" : "text-blue-500"
                      }`}>{tip.category}</span>
                      {tip.badge && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-neutral-300" />
                          <span className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-wider">{tip.badge}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-neutral-300 transition-transform duration-300 ${expandedId === tip.id ? "rotate-180" : ""}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Card Content (Accordion) */}
              <div className={`transition-all duration-300 ease-in-out ${expandedId === tip.id ? "max-h-[1000px] opacity-100 border-t border-neutral-50/50" : "max-h-0 opacity-0 invisible"}`}>
                <div className="px-6 pb-6 pt-2 space-y-4">
                  <ul className="space-y-3">
                    {tip.content.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${tip.type === "warning" ? "bg-orange-400" : "bg-blue-400"}`} />
                        <p className="text-[0.9rem] font-medium text-neutral-600 leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>

                  {tip.legend && (
                    <div className="bg-neutral-50 rounded-2xl p-4 flex flex-wrap gap-x-4 gap-y-2 border border-neutral-100">
                      {tip.legend.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${l.color}`} />
                          <span className="text-[0.7rem] font-bold text-neutral-500">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {tip.note && (
                    <div className={`rounded-2xl p-4 flex gap-3 ${tip.type === "warning" ? "bg-orange-100/50" : "bg-blue-50/50"}`}>
                      <svg className={`w-4 h-4 flex-shrink-0 ${tip.type === "warning" ? "text-orange-500" : "text-blue-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className={`text-[0.75rem] font-bold leading-relaxed ${tip.type === "warning" ? "text-orange-700" : "text-blue-700"}`}>
                        {tip.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-[0.9rem] font-bold text-neutral-400 uppercase tracking-widest">Tips tidak ditemukan</p>
          </div>
        )}

        {/* Section 6 — Catatan ZPILOT */}
        <div className="bg-[#2d5af1] rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <img src="/logo.png" alt="ZPILOT" className="w-6 h-6 invert grayscale brightness-200" />
              </div>
              <p className="text-[0.8rem] font-black uppercase tracking-widest text-blue-100">Catatan ZPILOT</p>
            </div>
            <p className="text-[1.05rem] font-bold leading-relaxed mb-6 opacity-90">
              ZPILOT membantu membaca kondisi lapangan realtime seperti aktivitas driver, merchant, dan peluang area.
            </p>
            <p className="text-[0.9rem] font-medium leading-relaxed mb-8 opacity-70">
              Tetapi ingat, order tetap ditentukan sistem platform dan performa masing-masing akun.
            </p>
            <div className="border-t border-white/20 pt-6">
               <p className="text-[0.85rem] font-bold italic opacity-60">
                 "Kadang zona terbaik bukan yang paling ramai, tapi yang paling seimbang."
               </p>
            </div>
          </div>
        </div>
      </div>

      <DriverBottomNav />
    </div>
  );
}
