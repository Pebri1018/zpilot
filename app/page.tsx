import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { AppIntro } from "@/components/AppIntro";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AppIntro authenticated={!!user}>
      <div className="min-h-[100dvh] bg-[#f2f2f4] text-neutral-900 antialiased flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8 text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mb-6 overflow-hidden border border-neutral-100">
            <img src="/logo.png" alt="ZPILOT" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[2.2rem] font-black tracking-tight leading-none mb-2">ZPILOT</h1>
          <h2 className="text-[1.1rem] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">Radar Pintar Driver</h2>
          <p className="text-[0.95rem] text-neutral-500 font-medium max-w-[280px] leading-relaxed">
            Cari spot ramai, hindari zona padat, ambil keputusan lebih cerdas.
          </p>
        </div>

        {/* Preview Cards */}
        <div className="px-5 space-y-3 mb-10">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-4 border border-white/40 shadow-sm">
              <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-widest mb-2">Radar</p>
              <div className="h-16 flex items-center justify-center relative">
                 <div className="absolute w-12 h-12 rounded-full bg-blue-500/10 animate-ping" />
                 <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                   <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                 </div>
              </div>
              <p className="text-[0.7rem] font-bold text-center mt-2 text-neutral-600">Scan Real-time</p>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-4 border border-white/40 shadow-sm">
              <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-widest mb-2">Zona Ramai</p>
              <div className="space-y-1.5 mt-1">
                <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden"><div className="h-full w-[80%] bg-blue-500 rounded-full" /></div>
                <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden"><div className="h-full w-[40%] bg-blue-500 rounded-full" /></div>
                <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden"><div className="h-full w-[60%] bg-blue-500 rounded-full" /></div>
              </div>
              <p className="text-[0.7rem] font-bold text-center mt-3 text-neutral-600">Top 5 Lokasi</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg shadow-blue-900/20">
            <div className="flex items-center justify-between mb-4">
               <div>
                 <p className="text-[1.2rem] font-black">124 Driver</p>
                 <p className="text-[0.7rem] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Aktif Sekarang</p>
               </div>
               <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-3 border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-[0.75rem] font-bold">12 Resto sedang ramai di Jogja</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-12 space-y-3 mt-auto">
          <Link 
            href="/login" 
            className="block w-full bg-neutral-900 text-white text-[1rem] font-bold py-4 rounded-2xl text-center shadow-lg active:scale-95 transition-all"
          >
            Masuk / Daftar
          </Link>
          <Link 
            href="/demo" 
            className="block w-full bg-white text-neutral-900 text-[1rem] font-bold py-4 rounded-2xl text-center border border-neutral-200 shadow-sm active:scale-95 transition-all"
          >
            Lihat Demo
          </Link>
        </div>
      </div>
    </AppIntro>
  );
}
  );
}
