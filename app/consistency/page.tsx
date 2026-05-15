"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { createClient } from "@/lib/supabase/client";

export default function ConsistencyPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [day, setDay] = useState(3); // Mocking day 3 for now
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Simulate fetching
      setTimeout(() => {
        setStats({
          todayOnline: "6j 12m",
          peakHours: "18:00 - 21:00",
          topZones: ["Seturan", "Babarsari", "Concat"],
          insights: [
            "Akunmu cenderung lebih aktif malam hari.",
            "Performa area kampus lebih stabil untuk akunmu.",
            "Terlalu lama idle di satu titik menurunkan movement."
          ],
          targets: [
            { label: "Online minimal 4 jam", done: true },
            { label: "Tidak idle terlalu lama", done: true },
            { label: "Pindah zona minimal 2x", done: false },
            { label: "Online di peak hour", done: true }
          ]
        });
        setLoading(false);
      }, 1000);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] pb-24 text-neutral-900 antialiased">
      {/* Header */}
      <div className="bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <Link href="/akun" className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 active:scale-95 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-[1.2rem] font-black tracking-tight">Mode Konsisten</h1>
        </div>

        <div className="relative z-10">
          <h2 className="text-[1.6rem] font-black leading-tight tracking-tight mb-2">Program Konsisten 30 Hari</h2>
          <p className="text-[0.85rem] font-medium text-neutral-500 leading-relaxed mb-6">
            Bangun pola online yang lebih stabil dan pantau histori akunmu secara personal.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[0.8rem] font-black text-blue-600 uppercase tracking-widest">Progress Program</p>
              <p className="text-[0.9rem] font-black text-neutral-900">Hari {day} <span className="text-neutral-300">/ 30</span></p>
            </div>
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all duration-1000" style={{ width: `${(day/30)*100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-6 space-y-6 max-w-md mx-auto">
        
        {/* Section 2 — Check-in Card */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-neutral-100 relative overflow-hidden group">
          <div className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-[0.65rem] font-black text-neutral-400 uppercase tracking-widest mb-3">Status Hari Ini</p>
          <h3 className="text-[1.3rem] font-black text-neutral-900 mb-1">
            Kamu online <span className="text-blue-600">{stats?.todayOnline || "--"}</span>
          </h3>
          <p className="text-[0.8rem] font-medium text-neutral-500">Pola online-mu hari ini terlihat cukup stabil.</p>
          
          <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-neutral-50">
            <div className="bg-neutral-50 rounded-2xl p-3 text-center">
              <p className="text-[0.6rem] font-bold text-neutral-400 uppercase mb-1">Total Idle</p>
              <p className="text-[0.9rem] font-black text-neutral-700">42 Menit</p>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-3 text-center">
              <p className="text-[0.6rem] font-bold text-neutral-400 uppercase mb-1">Pindah Zona</p>
              <p className="text-[0.9rem] font-black text-neutral-700">3 Kali</p>
            </div>
          </div>
        </div>

        {/* Section 3 — Analytics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[1rem] font-black text-neutral-800 tracking-tight">Insight Akun</h4>
            <span className="text-[0.6rem] font-black bg-blue-600 text-white px-2 py-1 rounded-lg tracking-widest">LIVE INSIGHT</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-neutral-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Peak Hour Akun</p>
                <p className="text-[0.95rem] font-black text-neutral-800 leading-tight">
                  Akunmu paling aktif antara <span className="text-orange-600">{stats?.peakHours}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-neutral-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Pola Mingguan</p>
                <p className="text-[0.95rem] font-black text-neutral-800 leading-tight">Sabtu & Minggu adalah hari paling produktif.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 — Top Zones */}
        <div className="bg-neutral-900 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-16 -mb-16" />
          <h4 className="text-[0.75rem] font-black text-white/40 uppercase tracking-widest mb-6">Zona Favorit Akun</h4>
          <div className="space-y-4 relative z-10">
            {stats?.topZones.map((zone: string, i: number) => (
              <div key={zone} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[0.8rem] font-black text-white/60">
                    {i + 1}
                  </div>
                  <p className="text-[0.95rem] font-black text-white/90">{zone}</p>
                </div>
                <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${80 - (i*20)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[0.7rem] font-bold text-white/30 text-center uppercase tracking-[0.2em]">Zona paling sering aktif untuk akunmu</p>
        </div>

        {/* Section 5 — Insights */}
        <div className="space-y-4">
          <h4 className="text-[1rem] font-black text-neutral-800 tracking-tight px-2">Insight Konsisten</h4>
          <div className="space-y-3">
            {stats?.insights.map((insight: string, i: number) => (
              <div key={i} className="bg-blue-50/50 border border-blue-100/50 rounded-3xl p-5 flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[0.85rem] font-bold text-blue-900/80 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6 — Daily Target */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[1rem] font-black text-neutral-800 tracking-tight">Target Harian</h4>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.targets.map((target: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${target.done ? "bg-blue-600 border-blue-600" : "border-neutral-200"}`}>
                    {target.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-[0.9rem] font-bold ${target.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                    {target.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 7 — Notes */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <p className="text-[0.7rem] font-black uppercase tracking-widest text-blue-100">Catatan ZPILOT</p>
          </div>
          <p className="text-[0.9rem] font-bold leading-relaxed opacity-90 mb-6">
            Setiap akun punya pola order yang berbeda. ZPILOT membantu membaca histori dan kebiasaan akunmu agar rekomendasi area jadi lebih personal.
          </p>
          <div className="pt-6 border-t border-white/20">
            <p className="text-[0.75rem] font-black italic text-blue-200 opacity-60">"Konsistensi adalah kunci utama performa akun."</p>
          </div>
        </div>

      </div>

      <DriverBottomNav />
    </div>
  );
}
