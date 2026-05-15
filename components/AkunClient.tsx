"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { updateProfile, changePassword, sendFeedback, deleteAccount } from "@/app/akun/actions";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  email: string;
  nama: string | null;
  kota: string | null;
  platform: string;
  driverId: string | null;
  zpilotId: string | null;
  role: string;
  feedback?: any[];
};

export function AkunClient({ email, nama, kota, platform, driverId, zpilotId, role, feedback = [] }: Props) {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const [notif, setNotif] = useState(true);
  const [batterySaver, setBatterySaver] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  const [modal, setModal] = useState<"profile" | "password" | "feedback" | "delete" | "history" | "settings" | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function copyZpilotId() {
    if (!zpilotId) return;
    navigator.clipboard.writeText(zpilotId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const WHATSAPP_NUMBER = "6285811757552";

  const profileItems = [
    { label: "Email", value: email },
    { label: t("edit_profile").split(" ")[1] || "Name", value: nama || "—" },
    { label: "Area", value: kota || "—" },
    { label: "Platform", value: platform },
    { label: "ID Driver", value: driverId?.trim() || "—" },
  ];

  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();
  }, []);

  return (
    <div className="space-y-5">
      {!isStandalone && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 shadow-lg relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-white font-black text-[1.1rem] leading-tight mb-1">Install Aplikasi ZPILOT</p>
              <p className="text-white/70 text-[0.8rem] font-medium leading-snug">GPS lebih stabil & hemat kuota. Klik <span className="inline-flex items-center justify-center w-5 h-5 bg-white/20 rounded mx-0.5"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01" /></svg></span> lalu pilih <span className="font-bold text-white">"Tambahkan ke Layar Utama"</span>.</p>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`p-4 rounded-2xl text-[0.85rem] font-bold animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-2 underline opacity-50">{t("cancel")}</button>
        </div>
      )}

      <div className="bg-neutral-900 rounded-3xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] font-bold text-white/40 uppercase tracking-widest mb-1">ID ZPILOT</p>
          <p className="text-[1.15rem] font-black text-white tracking-widest">{zpilotId || "—"}</p>
        </div>
        <button
          onClick={copyZpilotId}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.75rem] font-bold transition-all active:scale-90 ${
            copied
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {copied ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          )}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>

      {role === "admin" && (
        <a 
          href="/admin" 
          className="flex items-center justify-between bg-[#1E293B] text-white px-5 py-4 rounded-3xl shadow-lg active:scale-95 transition-transform border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-inner">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p className="font-black text-[1rem]">Admin Panel</p>
              <p className="text-[0.75rem] text-slate-300 font-medium leading-tight">Kelola ZPILOT & Data Resto</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>
      )}

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

      <button 
        onClick={() => router.push("/tips-gacor")} 
        className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl overflow-hidden shadow-lg shadow-blue-500/20 p-5 flex items-center justify-between active:scale-[0.98] transition-all relative"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="text-left">
            <p className="font-black text-[1.1rem] text-white tracking-tight leading-none">Tips Gacor</p>
            <p className="text-[0.75rem] font-bold text-blue-100 mt-1.5 uppercase tracking-wider">Official Guide & Insight</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      <button 
        onClick={() => router.push("/consistency")} 
        className="w-full bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-neutral-100 p-5 flex items-center justify-between active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div className="text-left">
            <p className="font-black text-[1.1rem] text-neutral-900 tracking-tight">Mode Konsisten</p>
            <p className="text-[0.75rem] font-medium text-neutral-500 mt-0.5">Pantau histori & pola akun 30 hari</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      <button 
        onClick={() => setModal("settings")} 
        className="w-full bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-neutral-100 p-5 flex items-center justify-between active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div className="text-left">
            <p className="font-black text-[1.1rem] text-neutral-900 tracking-tight">Pengaturan</p>
            <p className="text-[0.75rem] font-medium text-neutral-500 mt-0.5">Bahasa, Notif, Edit Akun, Bantuan</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      <div className="space-y-2 pb-10">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-700 font-bold py-4 rounded-2xl shadow-sm hover:bg-neutral-50 active:scale-[0.98] transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {loggingOut ? "..." : t("logout")}
        </button>
      </div>

      {modal && (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-5 bg-neutral-900/40 backdrop-blur-sm transition-all duration-300 ${modal === "settings" ? "" : "animate-in fade-in"}`}>
          <div className={`bg-[#f7f7f8] dark:bg-neutral-900 w-full max-w-md ${modal === "settings" ? "h-[100dvh] overflow-y-auto" : "rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95"}`}>
            {modal === "settings" && (
              <div className="min-h-full flex flex-col">
                <div className="sticky top-0 z-10 bg-[#f7f7f8]/90 dark:bg-neutral-900/90 backdrop-blur-xl px-5 py-4 flex items-center gap-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
                  <button onClick={() => setModal(null)} className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                    <svg className="w-5 h-5 text-neutral-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h2 className="text-[1.2rem] font-black tracking-tight dark:text-white">Pengaturan</h2>
                </div>
                
                <div className="p-5 flex-1 space-y-6 pb-20">
                  {/* Preferences */}
                  <div className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100 dark:border-neutral-700">
                    <div className="px-5 pt-4 pb-2"><p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Preferensi Aplikasi</p></div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      <div className="flex justify-between items-center px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg></div>
                          <span className="text-[0.95rem] font-semibold dark:text-white">{t("language")}</span>
                        </div>
                        <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-700 p-1">
                          {(["ID", "EN"] as const).map((l) => (
                            <button key={l} onClick={() => setLang(l)} className={`px-4 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${lang === l ? "bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
                          <span className="text-[0.95rem] font-semibold dark:text-white">{t("notifications")}</span>
                        </div>
                        <button onClick={() => setNotif(!notif)} className={`relative w-12 h-6 rounded-full transition-colors ${notif ? "bg-neutral-900 dark:bg-neutral-600" : "bg-neutral-300 dark:bg-neutral-700"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notif ? "translate-x-6" : ""}`} /></button>
                      </div>
                      <div className="flex justify-between items-center px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                          </div>
                          <span className="text-[0.95rem] font-semibold">Mode Gelap</span>
                        </div>
                        <button onClick={toggleDarkMode} className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? "bg-neutral-900" : "bg-neutral-300"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-6" : ""}`} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                          <div><span className="text-[0.95rem] font-semibold block">{t("battery_saver")}</span><span className="text-[0.75rem] text-neutral-500">{lang === "ID" ? "GPS refresh lebih jarang" : "Slower GPS refresh"}</span></div>
                        </div>
                        <button onClick={() => setBatterySaver(!batterySaver)} className={`relative w-12 h-6 rounded-full transition-colors ${batterySaver ? "bg-green-600" : "bg-neutral-300"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${batterySaver ? "translate-x-6" : ""}`} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Account */}
                  <div className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100 dark:border-neutral-700">
                    <div className="px-5 pt-4 pb-2"><p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Akun</p></div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      <button onClick={() => setModal("profile")} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 transition">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                        <span className="text-[0.95rem] font-semibold dark:text-white">{t("edit_profile")}</span><svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button onClick={() => setModal("password")} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 transition">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                        <span className="text-[0.95rem] font-semibold dark:text-white">{t("change_password")}</span><svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Help */}
                  <div className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100 dark:border-neutral-700">
                    <div className="px-5 pt-4 pb-2"><p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">Bantuan & Masukan</p></div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo Admin ZPILOT, saya butuh bantuan.`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 transition">
                        <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div>
                        <span className="text-[0.95rem] font-semibold dark:text-white">{t("hubungi_admin")}</span><svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </a>
                      <button onClick={() => setModal("feedback")} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 transition">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
                        <span className="text-[0.95rem] font-semibold dark:text-white">{t("kirim_masukan")}</span><svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button onClick={() => setModal("history")} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 transition">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <span className="text-[0.95rem] font-semibold dark:text-white">{lang === "ID" ? "Riwayat Masukan" : "Feedback History"}</span>
                        {feedback.some(f => f.admin_reply && f.status !== "closed") && <span className="bg-red-500 w-2 h-2 rounded-full ml-1" />}
                        <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button 
                        onClick={async () => {
                          localStorage.clear();
                          sessionStorage.clear();
                          if ('caches' in window) {
                            const keys = await caches.keys();
                            await Promise.all(keys.map(key => caches.delete(key)));
                          }
                          setMsg({ type: "success", text: "Cache dibersihkan" });
                          setTimeout(() => window.location.reload(), 1000);
                        }} 
                        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 transition"
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
                        <span className="text-[0.95rem] font-semibold dark:text-white">Hapus Cache</span>
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-2">
                    <button onClick={() => setModal("delete")} className="w-full text-[0.85rem] font-bold text-red-500 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition">
                      {t("delete_account")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {modal === "profile" && (
              <form action={async (fd) => {
                setLoading(true);
                const res = await updateProfile(fd);
                setLoading(false);
                if (res.success) { setModal(null); setMsg({ type: "success", text: t("update") + " OK" }); }
                else setMsg({ type: "error", text: res.error || "Error" });
              }} className="space-y-4">
                <h3 className="text-[1.1rem] font-bold dark:text-white">{t("edit_profile")}</h3>
                <div className="space-y-3">
                  <input name="nama" defaultValue={nama || ""} placeholder="Nama" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[0.9rem] dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500" required />
                  <input name="kota" defaultValue={kota || ""} placeholder="Kota" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[0.9rem] dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500" required />
                  <input name="driver_id" defaultValue={driverId || ""} placeholder="ID Driver" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[0.9rem] dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500" required />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-700 font-bold text-neutral-600 dark:text-neutral-300">{t("cancel")}</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-neutral-900 dark:bg-neutral-600 font-bold text-white disabled:opacity-50">{t("save")}</button>
                </div>
              </form>
            )}

            {modal === "password" && (
              <form action={async (fd) => {
                setLoading(true);
                const res = await changePassword(fd);
                setLoading(false);
                if (res.success) { setModal(null); setMsg({ type: "success", text: t("update") + " OK" }); }
                else setMsg({ type: "error", text: res.error || "Error" });
              }} className="space-y-4">
                <h3 className="text-[1.1rem] font-bold dark:text-white">{t("change_password")}</h3>
                <input name="password" type="password" placeholder="Password Baru" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[0.9rem] dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500" required minLength={6} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-700 font-bold text-neutral-600 dark:text-neutral-300">{t("cancel")}</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-neutral-900 dark:bg-neutral-600 font-bold text-white disabled:opacity-50">{t("update")}</button>
                </div>
              </form>
            )}

            {modal === "feedback" && (
              <form action={async (fd) => {
                setLoading(true);
                const res = await sendFeedback(fd);
                setLoading(false);
                if (res.success) { setModal(null); setMsg({ type: "success", text: "OK" }); }
                else setMsg({ type: "error", text: res.error || "Error" });
              }} className="space-y-4">
                <h3 className="text-[1.1rem] font-bold">{t("kirim_masukan")}</h3>
                <textarea name="message" placeholder="..." rows={4} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 font-bold text-neutral-600">{t("cancel")}</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-blue-600 font-bold text-white disabled:opacity-50">{t("update")}</button>
                </div>
              </form>
            )}

            {modal === "delete" && (
              <div className="space-y-4 text-center">
                <h3 className="text-[1.1rem] font-bold">{t("delete_account")}?</h3>
                <p className="text-[0.85rem] text-neutral-500">{lang === "ID" ? "Tindakan ini permanen." : "This is permanent."}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={async () => {
                    setLoading(true);
                    await deleteAccount();
                    router.push("/login");
                  }} disabled={loading} className="w-full py-3 rounded-2xl bg-red-600 font-bold text-white disabled:opacity-50">{lang === "ID" ? "Ya, Hapus" : "Yes, Delete"}</button>
                  <button onClick={() => setModal(null)} className="w-full py-3 rounded-2xl bg-neutral-100 font-bold text-neutral-600">{t("cancel")}</button>
                </div>
              </div>
            )}
            {modal === "history" && (
              <div className="space-y-4 max-h-[70vh] flex flex-col">
                <h3 className="text-[1.1rem] font-bold px-1">{lang === "ID" ? "Riwayat Masukan" : "Feedback History"}</h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {feedback.length === 0 ? (
                    <p className="text-center py-10 text-neutral-400 font-medium">Belum ada riwayat.</p>
                  ) : (
                    feedback.map((f) => (
                      <div key={f.id} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-widest">{new Date(f.created_at).toLocaleDateString()}</span>
                          <span className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-md ${f.status === 'closed' ? 'bg-neutral-200 text-neutral-500' : 'bg-orange-100 text-orange-600'}`}>{f.status}</span>
                        </div>
                        <p className="text-[0.85rem] font-medium text-neutral-800 italic">"{f.message}"</p>
                        {f.admin_reply && (
                          <div className="mt-3 bg-white p-3 rounded-xl border border-blue-100">
                            <p className="text-[0.65rem] font-black text-blue-600 uppercase mb-1">Balasan Admin</p>
                            <p className="text-[0.82rem] font-bold text-neutral-700 italic">"{f.admin_reply}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <button onClick={() => setModal(null)} className="w-full py-3 rounded-2xl bg-neutral-900 font-bold text-white mt-2">Tutup</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
