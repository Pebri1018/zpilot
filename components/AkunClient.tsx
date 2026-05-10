"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  email: string;
  nama: string | null;
  kota: string | null;
  platform: string;
  driverId: string | null;
};

export function AkunClient({ email, nama, kota, platform, driverId }: Props) {
  const router = useRouter();
  const [notif, setNotif] = useState(true);
  const [batterySaver, setBatterySaver] = useState(false);
  const [lang, setLang] = useState<"ID" | "EN">("ID");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const WHATSAPP_NUMBER = "6281234567890"; // Ganti dengan nomor WhatsApp founder

  const profileItems = [
    { label: "Email", value: email },
    { label: "Nama", value: nama || "—" },
    { label: "Kota / Area", value: kota || "—" },
    { label: "Platform", value: platform },
    { label: "ID Driver", value: driverId?.trim() || "—" },
  ];

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-neutral-100">
        <div className="bg-neutral-900 px-5 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl font-black">
            {(nama || email)?.[0]?.toUpperCase() || "D"}
          </div>
          <div>
            <p className="text-white font-bold text-[1.05rem]">{nama || "Driver"}</p>
            <p className="text-white/60 text-[0.8rem] mt-0.5">{email}</p>
          </div>
        </div>
        <div className="divide-y divide-neutral-100">
          {profileItems.map((item) => (
            <div key={item.label} className="flex justify-between items-center px-5 py-3.5">
              <span className="text-[0.8rem] font-medium text-neutral-500">{item.label}</span>
              <span className="text-[0.9rem] font-semibold text-neutral-900 truncate max-w-[55%] text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-neutral-100">
        <div className="px-5 pt-4 pb-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Pengaturan</p>
        </div>
        <div className="divide-y divide-neutral-100">
          {/* Language Toggle */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <span className="text-[0.9rem] font-semibold">Bahasa</span>
            </div>
            <div className="flex rounded-xl bg-neutral-100 p-0.5">
              {(["ID", "EN"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${lang === l ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Toggle */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-[0.9rem] font-semibold">Notifikasi</span>
            </div>
            <button
              onClick={() => setNotif(!notif)}
              className={`relative w-12 h-6 rounded-full transition-colors ${notif ? "bg-neutral-900" : "bg-neutral-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notif ? "translate-x-6" : ""}`} />
            </button>
          </div>

          {/* Battery Saver */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-[0.9rem] font-semibold block">Hemat Baterai</span>
                <span className="text-[0.72rem] text-neutral-500">GPS refresh lebih jarang</span>
              </div>
            </div>
            <button
              onClick={() => setBatterySaver(!batterySaver)}
              className={`relative w-12 h-6 rounded-full transition-colors ${batterySaver ? "bg-green-600" : "bg-neutral-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${batterySaver ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit & Password */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-neutral-100">
        <div className="divide-y divide-neutral-100">
          <button className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[0.9rem] font-semibold">Edit Profil</span>
            <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-[0.9rem] font-semibold">Ubah Password</span>
            <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-neutral-100">
        <div className="px-5 pt-4 pb-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Bantuan</p>
        </div>
        <div className="divide-y divide-neutral-100">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo Admin ZTIPS, saya butuh bantuan.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 active:bg-neutral-100 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="text-[0.9rem] font-semibold">Hubungi Admin</span>
            <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <button className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-[0.9rem] font-semibold">Kirim Masukan</span>
            <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-2">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-700 font-bold py-4 rounded-2xl shadow-sm hover:bg-neutral-50 active:scale-[0.98] transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {loggingOut ? "Keluar..." : "Keluar Akun"}
        </button>
        <button className="w-full text-[0.85rem] font-medium text-red-500 py-2 hover:text-red-700 transition">
          Hapus Akun
        </button>
      </div>
    </div>
  );
}
