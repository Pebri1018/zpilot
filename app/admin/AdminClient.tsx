"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Broadcast } from "./actions";
import { createBroadcast, deleteBroadcast } from "./actions";
import { upsertMerchant, toggleMerchantActive, getAllMerchants, deleteMerchant, type MerchantSignal } from "./actions/signals";
import { saveNgetemSpot } from "./actions/notes";
import { toggleUserDisabled, deleteUserAccount, replyFeedback } from "./actions/admin_data";
import { useLanguage } from "@/context/LanguageContext";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

type Props = {
  broadcasts: Broadcast[];
  initialMerchants?: MerchantSignal[];
  initialUsers?: any[];
  initialFeedback?: any[];
  stats: { users: number; feedback: number; signals: number; resto: number; seller: number; spots: number };
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { id: "kelola_data", label: "Kelola Data", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: "add_merchant", label: "Tambah Resto", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
  { id: "add_seller", label: "Tambah Seller", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { id: "radar", label: "Tambah Spot", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { id: "manual_signal", label: "Tambah Sinyal", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: "feedback", label: "Feedback", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg> },
  { id: "broadcast", label: "Broadcast", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
  { id: "flash_sale", label: "Flash Sale", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
];

export function AdminClient({ broadcasts, initialMerchants = [], initialUsers = [], initialFeedback = [], stats }: Props) {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [merchantMode, setMerchantMode] = useState<"quick" | "detail">("quick");
  const [merchants, setMerchants] = useState(initialMerchants);
  const [users, setUsers] = useState(initialUsers);
  const [editingMerchant, setEditingMerchant] = useState<any | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [area, setArea] = useState<string>("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("All");
  const merchantFormRef = useRef<HTMLFormElement>(null);

  // Auto-detect admin current location on start
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center -mb-2 animate-in fade-in slide-in-from-top-2">
        {activeTab === "dashboard" ? (
          <div className="flex w-full gap-2">
            <a href="/akun" className="flex-1 flex justify-center items-center gap-2 text-[0.8rem] font-bold text-neutral-500 bg-white px-4 py-3 rounded-xl shadow-sm border border-neutral-100 active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Ke App
            </a>
            <button onClick={() => setActiveTab("menu")} className="flex-1 flex justify-center items-center gap-2 text-[0.85rem] font-black text-white bg-neutral-900 px-4 py-3 rounded-xl shadow-lg active:scale-95 transition-all">
              Menu Admin
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => {
            if (["users", "merchants", "spots_list", "signals_list"].includes(activeTab)) {
              setActiveTab("kelola_data");
            } else {
              setActiveTab("dashboard");
            }
          }} className="flex items-center gap-2 text-[0.8rem] font-bold text-neutral-500 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-neutral-100 active:scale-95 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali
          </button>
        )}
      </div>

      {/* 1. DASHBOARD & MENU */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm">
              <p className="text-[0.7rem] font-bold uppercase text-neutral-400 mb-1">Users</p>
              <p className="text-[1.8rem] font-black">{stats.users}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm">
              <p className="text-[0.7rem] font-bold uppercase text-neutral-400 mb-1">Pending Feedback</p>
              <p className="text-[1.8rem] font-black">{stats.feedback}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm col-span-2">
              <p className="text-[0.7rem] font-bold uppercase text-neutral-400 mb-1">Total Active Signals</p>
              <p className="text-[1.8rem] font-black">{stats.signals + stats.spots}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm bg-blue-50/50">
              <p className="text-[0.7rem] font-bold uppercase text-blue-400 mb-1">Total Resto</p>
              <p className="text-[1.5rem] font-black text-blue-900">{stats.resto}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm bg-orange-50/50">
              <p className="text-[0.7rem] font-bold uppercase text-orange-400 mb-1">Total Seller</p>
              <p className="text-[1.5rem] font-black text-orange-900">{stats.seller}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm col-span-2 bg-purple-50/50">
              <p className="text-[0.7rem] font-bold uppercase text-purple-400 mb-1">Total Spot</p>
              <p className="text-[1.5rem] font-black text-purple-900">{stats.spots}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1.5 MENU ADMIN */}
      {activeTab === "menu" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Menu List */}
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100">
            <div className="px-5 pt-4 pb-2 flex justify-between items-center">
              <p className="text-[0.8rem] font-black uppercase tracking-widest text-neutral-900">Menu Utama</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {NAV.filter(n => n.id !== "dashboard").map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[0.95rem] font-semibold">{item.label}</span>
                  {item.id === "feedback" && stats.feedback > 0 && <span className="bg-red-500 w-2 h-2 rounded-full ml-1" />}
                  <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1.6 KELOLA DATA */}
      {activeTab === "kelola_data" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100">
            <div className="px-5 pt-4 pb-2 flex justify-between items-center">
              <p className="text-[0.8rem] font-black uppercase tracking-widest text-neutral-900">Kelola Data</p>
            </div>
            <div className="divide-y divide-neutral-100">
              <button onClick={() => setActiveTab("users")} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
                <span className="text-[1.2rem]">👤</span>
                <span className="text-[0.95rem] font-semibold">Data User Driver</span>
                <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => { setActiveTab("merchants"); setFilterLevel("Resto"); }} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
                <span className="text-[1.2rem]">🍽️</span>
                <span className="text-[0.95rem] font-semibold">Data Restoran Aktif</span>
                <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => { setActiveTab("merchants"); setFilterLevel("Seller"); }} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
                <span className="text-[1.2rem]">📦</span>
                <span className="text-[0.95rem] font-semibold">Data Seller SPX / Ekspedisi</span>
                <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => setActiveTab("spots_list")} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
                <span className="text-[1.2rem]">📍</span>
                <span className="text-[0.95rem] font-semibold">Data Spot Mangkal</span>
                <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => setActiveTab("signals_list")} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition">
                <span className="text-[1.2rem]">📡</span>
                <span className="text-[0.95rem] font-semibold">Data Sinyal Manual (10 Menit)</span>
                <svg className="w-4 h-4 text-neutral-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUMMY LISTS */}
      {activeTab === "spots_list" && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center">
          <p className="text-neutral-500 font-bold">List Data Spot sedang dalam pembaruan.</p>
        </div>
      )}
      {activeTab === "signals_list" && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center">
          <p className="text-neutral-500 font-bold">List Data Sinyal (Sesi 10 Menit) sedang dalam pembaruan.</p>
        </div>
      )}

      {/* 2. ADD MERCHANT */}
      {activeTab === "add_merchant" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1.1rem] font-black tracking-tight">Tambah Data Resto / Seller</h3>
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button onClick={() => setMerchantMode("quick")} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-bold transition-all ${merchantMode === "quick" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{t("quick_mode")}</button>
                <button onClick={() => setMerchantMode("detail")} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-bold transition-all ${merchantMode === "detail" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{t("detail_mode")}</button>
              </div>
            </div>

            <form ref={merchantFormRef} action={async (fd) => {
              setLoading(true);
              fd.append("lat", String(lat)); fd.append("lng", String(lng)); fd.append("area", area); fd.append("address", address);
              const res = await upsertMerchant(fd);
              setLoading(false);
              if (res.success) { 
                merchantFormRef.current?.reset(); 
                const updated = await getAllMerchants(); 
                setMerchants(updated);
                alert("Saved!");
              } else alert(res.error);
            }} className="space-y-4">
              <input name="name" required placeholder="Nama Resto / Toko / Seller" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold focus:border-neutral-900 focus:bg-white transition-all outline-none" />
              
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
                setLat(newLat); setLng(newLng); setAddress(addr); setArea(ar);
              }} />

              {merchantMode === "detail" && (
                <>
                  <select name="category" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold">
                    <option value="Makanan">🍱 Food / Resto</option>
                    <option value="Minuman">🥤 Drink</option>
                    <option value="Snack">🍟 Snack</option>
                  </select>
                  <textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("address")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input name="rating" type="number" step="0.1" placeholder={t("rating")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                <input name="reviews" type="number" placeholder={t("reviews")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3 border border-neutral-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="is_open_24h" 
                    id="is_open_24h_resto"
                    className="w-5 h-5 rounded-lg accent-neutral-900"
                    onChange={(e) => {
                      const grid = document.getElementById("time_grid_resto");
                      if (grid) grid.style.display = e.target.checked ? "none" : "grid";
                    }}
                  />
                  <span className="text-[0.85rem] font-bold text-neutral-700">Buka 24 Jam</span>
                </label>
                <div id="time_grid_resto" className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Buka</p>
                    <input name="open_time" type="time" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Tutup</p>
                    <input name="close_time" type="time" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="promo_active" id="promo_active" defaultChecked={false} onChange={(e) => {
                      const input = document.getElementById("promo_percent_container");
                      if (input) input.style.display = e.target.checked ? "block" : "none";
                    }} className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-0" />
                    <span className="text-[0.85rem] font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors">{t("promo")}</span>
                  </label>
                  {merchantMode === "detail" && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" name="pickup_fast" className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-0" />
                        <span className="text-[0.85rem] font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors">{t("fast_pickup")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" name="free_shipping" className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-0" />
                        <span className="text-[0.85rem] font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors">Diskon Ongkir</span>
                      </label>
                    </>
                  )}
                </div>
                <div id="promo_percent_container" style={{ display: "none" }}>
                  <input name="promo_percent" type="number" placeholder="Promo Percent (e.g. 20, 40)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                </div>
              </div>

              <button disabled={loading} className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[1.05rem]">
                {loading ? "..." : "Simpan Data"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2.1 ADD SELLER */}
      {activeTab === "add_seller" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1.1rem] font-black tracking-tight">Tambah Seller / Paket</h3>
            </div>

            <form action={async (fd) => {
              setLoading(true);
              fd.append("lat", String(lat)); fd.append("lng", String(lng)); fd.append("area", area); fd.append("address", address);
              // Force category logic based on name or user selection
              const res = await upsertMerchant(fd);
              setLoading(false);
              if (res.success) { 
                const updated = await getAllMerchants(); 
                setMerchants(updated);
                alert("Saved!");
              } else alert(res.error);
            }} className="space-y-4">
              <input name="name" required placeholder="Nama Toko Seller / Ekspedisi" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold focus:border-neutral-900 focus:bg-white transition-all outline-none" />
              
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
                setLat(newLat); setLng(newLng); setAddress(addr); setArea(ar);
              }} />

              <select name="category" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold">
                <option value="Paket">📦 Paket Ekspedisi (SPX, JNT, dll)</option>
                <option value="Toko/Seller">🏪 Toko Retail / Konter</option>
              </select>
              <textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("address")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3 border border-neutral-200 cursor-pointer mb-1">
                  <input 
                    type="checkbox" 
                    name="is_open_24h" 
                    id="is_open_24h_seller"
                    className="w-5 h-5 rounded-lg accent-neutral-900"
                    onChange={(e) => {
                      const grid = document.getElementById("time_grid_seller");
                      if (grid) grid.style.display = e.target.checked ? "none" : "grid";
                    }}
                  />
                  <span className="text-[0.85rem] font-bold text-neutral-700">Buka 24 Jam</span>
                </label>
              </div>

              <div id="time_grid_seller" className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Buka</p>
                  <input name="open_time" type="time" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Tutup</p>
                  <input name="close_time" type="time" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="pickup_fast" defaultChecked={false} className="w-5 h-5 rounded-lg border-2 border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-2 transition-colors cursor-pointer" />
                    <span className="text-[0.85rem] font-bold text-neutral-700 group-hover:text-neutral-900">Pickup Cepat (Sistem)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="free_shipping" defaultChecked={false} className="w-5 h-5 rounded-lg border-2 border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-2 transition-colors cursor-pointer" />
                    <span className="text-[0.85rem] font-bold text-neutral-700 group-hover:text-neutral-900">Gratis Ongkir</span>
                  </label>
                </div>
              </div>

              <button disabled={loading} className="w-full mt-4 bg-neutral-900 text-white font-black py-4 rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50 tracking-wide">
                {loading ? "Menyimpan..." : "Simpan Seller / Paket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. MERCHANTS LIST */}
      {activeTab === "merchants" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[0.75rem] font-black uppercase tracking-widest text-neutral-400 ml-2">Active Database</h4>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Search name or area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-[0.85rem] font-semibold outline-none focus:border-neutral-900"
              />
              <select 
                value={filterLevel} 
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-[0.85rem] font-semibold outline-none"
              >
                <option value="All">All Category</option>
                <option value="Resto">Resto</option>
                <option value="Seller">Seller SPX/Paket</option>
              </select>
            </div>

            {merchants
              .filter(m => {
                if (filterLevel === "All") return true;
                if (filterLevel === "Resto") return m.category !== "Seller SPX" && m.category !== "Paket" && m.category !== "Toko/Seller";
                if (filterLevel === "Seller") return m.category === "Seller SPX" || m.category === "Paket" || m.category === "Toko/Seller";
                return true;
              })
              .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.area.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(m => (
              <div key={m.id} className={`bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col gap-4 ${!m.is_active ? "opacity-60 grayscale" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-[1.05rem] tracking-tight">{m.name}</p>
                    <p className="text-[0.75rem] text-neutral-400 font-bold">{m.area}</p>
                  </div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-[0.85rem] shadow-sm ${m.live_score && m.live_score >= 66 ? 'bg-red-50 text-red-600' : m.live_score && m.live_score >= 41 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {m.live_score || m.busy_score || 0}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-neutral-50 rounded-xl p-2.5">
                    <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Rating / Reviews</p>
                    <p className="text-[0.85rem] font-black text-neutral-800">⭐ {m.rating || "-"} <span className="text-neutral-400 font-semibold">({m.reviews || 0})</span></p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-2.5">
                    <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Promo / Ongkir</p>
                    <p className="text-[0.85rem] font-black text-neutral-800">
                      {m.promo_active ? (m.promo_percent ? `${m.promo_percent}% OFF` : "Promo Aktif") : "No Promo"}
                      {m.free_shipping && <span className="ml-1 text-[0.7rem] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">Gratis Ongkir</span>}
                    </p>
                  </div>
                </div>
                {(m.open_time || m.close_time) && (
                  <div className="bg-neutral-50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest">Jam</span>
                    <span className="text-[0.82rem] font-black text-neutral-800">{m.open_time || "?"} – {m.close_time || "?"}</span>
                  </div>
                )}
                <p className="text-[0.65rem] text-neutral-400 font-semibold italic text-center -mt-1">
                  Updated: {new Date(m.updated_at || m.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                </p>

                <div className="flex flex-col gap-2 border-t border-neutral-50 pt-3">
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      const { boostMerchantLive } = await import("@/app/admin/actions/signals");
                      const res = await boostMerchantLive(m.id);
                      setLoading(false);
                      if (res.success) {
                        alert("Tandai ramai berhasil (+20 menit)!");
                      } else {
                        alert("Gagal tandai ramai");
                      }
                    }} 
                    className="w-full py-2.5 rounded-xl bg-purple-50 text-[0.75rem] font-bold text-purple-600 active:scale-95 transition-all"
                  >
                    🔥 Tandai Sedang Ramai (20mnt)
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingMerchant(m)} 
                      className="flex-1 py-2.5 rounded-xl bg-blue-50 text-[0.75rem] font-bold text-blue-600 active:scale-95 transition-all"
                    >
                      {t("edit")}
                    </button>
                    <button onClick={() => toggleMerchantActive(m.id, !m.is_active)} className={`flex-1 py-2.5 rounded-xl text-[0.75rem] font-bold uppercase tracking-widest transition-all ${m.is_active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"}`}>
                      {m.is_active ? t("enable") : t("disable")}
                    </button>
                    <button onClick={async () => {
                      if (confirm("Delete merchant?")) {
                        await deleteMerchant(m.id);
                        setMerchants(prev => prev.filter(x => x.id !== m.id));
                      }
                    }} className="flex-1 py-2.5 rounded-xl bg-red-50 text-[0.75rem] font-bold text-red-600 active:scale-95 transition-all">{t("delete")}</button>
                    <a href={`/radar?lat=${m.lat}&lng=${m.lng}`} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MANUAL SIGNALS */}
      {activeTab === "manual_signal" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <h3 className="text-[1.1rem] font-black tracking-tight mb-6">Input Sinyal Manual</h3>
            <p className="text-[0.85rem] text-neutral-500 mb-4 leading-relaxed">
              Tambahkan driver bayangan (fake drivers) atau spot khusus ke radar secara manual agar tampil di semua aplikasi driver.
            </p>
            <form action={async (fd) => {
              setLoading(true);
              const supabase = (await import("@/lib/supabase/client")).createClient();
              const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
              const { error } = await supabase.from("admin_manual_signals").insert({
                lat: lat,
                lng: lng,
                type: String(fd.get("type") || "driver_ngetem"),
                count: Number(fd.get("count") || 1),
                expires_at: expires_at
              });
              setLoading(false);
              if (error) alert(error.message);
              else alert("Sinyal berhasil ditambahkan!");
            }} className="space-y-4">
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng) => {
                setLat(newLat); setLng(newLng);
              }} />
              
              <div className="grid grid-cols-2 gap-4">
                <select name="type" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold">
                  <option value="driver_ngetem">🛵 Driver Ngetem</option>
                  <option value="spot">📍 Spot Mangkal</option>
                </select>
                <input name="count" type="number" defaultValue="1" min="1" placeholder="Jumlah Driver" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold" />
              </div>
              <button disabled={loading} className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 text-[1.05rem]">
                {loading ? "..." : "Tambahkan Sinyal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RADAR SPOTS */}
      {activeTab === "radar" && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-[1.1rem] font-black mb-6 tracking-tight">Add Spot Mangkal</h3>
          <form action={async (fd) => {
            setLoading(true);
            fd.append("lat", String(lat)); fd.append("lng", String(lng)); fd.append("area", area);
            const res = await saveNgetemSpot(fd);
            setLoading(false);
            if (res.success) alert("Spot saved!");
          }} className="space-y-4">
            <input name="name" required placeholder="Spot Name" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold outline-none focus:border-neutral-900 focus:bg-white" />
            
            <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
              setLat(newLat); setLng(newLng); setArea(ar);
            }} />

            <div className="grid grid-cols-2 gap-3">
              <select name="quality" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold">
                <option value="Bagus">💎 Good Quality</option>
                <option value="Lumayan">⚖️ Medium Quality</option>
                <option value="Jebakan">⚠️ Trap (Avoid)</option>
              </select>
              <input name="best_hours" placeholder="Best Hours (e.g. 11-13)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
            </div>
            <textarea name="notes" placeholder="Additional Notes" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />
            <button disabled={loading} className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? "..." : "Save Radar Spot"}
            </button>
          </form>
        </div>
      )}

      {/* 4. USERS */}
      {activeTab === "users" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {users.map(u => (
            <div key={u.id} className={`bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col gap-4 ${u.is_disabled ? "opacity-60 grayscale bg-neutral-50" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center font-black text-neutral-900 text-lg shadow-inner">{u.nama?.[0] || "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[1rem] tracking-tight text-neutral-900 leading-tight">{u.nama || "Unknown"}</p>
                  <p className="text-[0.7rem] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{u.platform} · {u.kota}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {u.ztips_id && (
                      <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[0.65rem] font-black px-2 py-0.5 rounded-lg tracking-widest">
                        {u.ztips_id}
                      </span>
                    )}
                    {u.driver_id && (
                      <span className="inline-flex items-center text-[0.65rem] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-lg">
                        ID: {u.driver_id}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${new Date().getTime() - new Date(u.last_active).getTime() < 300000 ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`} />
                </div>
              </div>
              <div className="flex gap-2 border-t border-neutral-50 pt-4">
                <button 
                  onClick={async () => {
                    const res = await toggleUserDisabled(u.id, !u.is_disabled);
                    if (res.success) setUsers(prev => prev.map(x => x.id === u.id ? {...x, is_disabled: !u.is_disabled} : x));
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[0.75rem] font-black uppercase tracking-widest transition-all ${u.is_disabled ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                >
                  {u.is_disabled ? "Enable" : "Disable"}
                </button>
                <button 
                  onClick={async () => {
                    if (confirm("Delete user account?")) {
                      const res = await deleteUserAccount(u.id);
                      if (res.success) setUsers(prev => prev.filter(x => x.id !== u.id));
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-[0.75rem] font-black uppercase tracking-widest transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. FEEDBACK */}
      {activeTab === "feedback" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {initialFeedback.length === 0 && <p className="text-center text-neutral-400 py-10 font-bold">No feedback received.</p>}
          {initialFeedback.map(f => (
            <div key={f.id} className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
              <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-black text-[0.95rem] tracking-tight text-neutral-900">{f.users?.nama || "Unknown"}</p>
                    <p className="text-[0.7rem] text-blue-500 font-bold mt-0.5">{f.users?.email || "—"}</p>
                  </div>
                  <span className="text-[0.65rem] font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-lg">
                    {new Date(f.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                </div>
                <p className="text-[0.9rem] text-neutral-700 leading-relaxed font-medium italic mt-2">"{f.message}"</p>
                
                {f.admin_reply && (
                  <div className="mt-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                    <p className="text-[0.65rem] font-black text-blue-600 uppercase tracking-widest mb-1">Reply Admin</p>
                    <p className="text-[0.85rem] text-neutral-800 font-medium italic">"{f.admin_reply}"</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <button 
                    onClick={() => setReplyingTo(replyingTo === f.id ? null : f.id)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 text-[0.7rem] font-bold text-neutral-600 hover:bg-neutral-200 transition-colors"
                  >
                    {f.admin_reply ? "Ubah Reply" : "Reply"}
                  </button>
                  {f.status !== "closed" && (
                    <button 
                      onClick={async () => {
                        if (confirm("Selesaikan masukan ini?")) {
                          await replyFeedback(f.id, f.admin_reply || "", "closed");
                          alert("Status diperbarui!");
                          window.location.reload();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-green-50 text-[0.7rem] font-bold text-green-600 hover:bg-green-100 transition-colors"
                    >
                      Selesaikan
                    </button>
                  )}
                  {f.status && (
                    <span className={`text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ml-auto ${
                      f.status === "reviewed" ? "bg-green-50 text-green-600" : f.status === "closed" ? "bg-neutral-100 text-neutral-400" : "bg-orange-50 text-orange-600"
                    }`}>{f.status}</span>
                  )}
                </div>

                {replyingTo === f.id && (
                  <form action={async (fd) => {
                    const msg = String(fd.get("reply") || "");
                    if (!msg.trim()) return;
                    setLoading(true);
                    const res = await replyFeedback(f.id, msg, "replied");
                    setLoading(false);
                    if (res.success) {
                      setReplyingTo(null);
                      alert("Balasan terkirim!");
                      window.location.reload();
                    } else alert(res.error);
                  }} className="mt-4 space-y-2 animate-in slide-in-from-top-2">
                    <textarea 
                      name="reply" 
                      defaultValue={f.admin_reply || ""} 
                      placeholder="Tulis balasan..." 
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.85rem] font-medium focus:outline-none focus:border-neutral-400 resize-none" 
                      rows={2} 
                      required 
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setReplyingTo(null)} className="flex-1 py-2 rounded-xl bg-neutral-100 text-[0.75rem] font-bold">Batal</button>
                      <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-blue-600 text-[0.75rem] font-bold text-white disabled:opacity-50">Kirim</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. BROADCAST */}
      {activeTab === "broadcast" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <h3 className="text-[1.1rem] font-black mb-6 tracking-tight tracking-tight">New Broadcast (10m)</h3>
            <form action={createBroadcast} className="space-y-4">
              <input name="title" required placeholder="Subject" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold outline-none focus:border-neutral-900 focus:bg-white" />
              <textarea name="message" required placeholder="Short Intel Message" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] resize-none font-medium" rows={3} />
              <select name="type" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-black uppercase tracking-wider">
                <option value="spot_ramai">🔥 Spot Ramai</option>
                <option value="hindari_area">⚠️ Hindari Area</option>
                <option value="promo_seller">💰 Promo Seller</option>
              </select>
              <button className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all">Broadcast Intel</button>
            </form>
          </div>
          <div className="space-y-3">
            {broadcasts.map(b => (
              <div key={b.id} className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                <div>
                  <p className="font-black text-[0.95rem] tracking-tight">{b.title}</p>
                  <p className="text-[0.65rem] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                    {b.expires_at ? `Exp: ${new Date(b.expires_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })}` : "Permanent"}
                  </p>
                </div>
                <button onClick={() => deleteBroadcast(b.id)} className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. FLASH SALE */}
      {activeTab === "flash_sale" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-[2.5rem] text-white shadow-lg">
            <h3 className="text-[1.2rem] font-black tracking-tight flex items-center gap-2 mb-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              Flash Sale
            </h3>
            <p className="text-[0.85rem] font-medium opacity-90 leading-relaxed">
              Aktifkan Flash Sale untuk restoran tertentu. Resto yang masuk Flash Sale akan otomatis menyala merah (High) di Radar semua driver.
            </p>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden divide-y divide-neutral-100">
            {merchants.map(m => (
              <div key={m.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-[0.95rem] tracking-tight">{m.name}</p>
                    {m.is_flash_sale && (
                      <span className="bg-rose-100 text-rose-700 text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">Aktif</span>
                    )}
                  </div>
                  <p className="text-[0.7rem] text-neutral-400 font-bold uppercase tracking-widest">{m.area}</p>
                </div>
                <button
                  onClick={async () => {
                    setLoading(true);
                    const { toggleFlashSale } = await import("@/app/admin/actions/signals");
                    const res = await toggleFlashSale(m.id, !m.is_flash_sale);
                    setLoading(false);
                    if (res.success) {
                      setMerchants(merchants.map(merch => merch.id === m.id ? { ...merch, is_flash_sale: !m.is_flash_sale } : merch));
                    } else alert(res.error);
                  }}
                  disabled={loading}
                  className={`relative shrink-0 w-14 h-8 rounded-full transition-colors ${m.is_flash_sale ? 'bg-rose-500' : 'bg-neutral-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${m.is_flash_sale ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
            {merchants.length === 0 && (
              <div className="p-6 text-center text-[0.85rem] font-bold text-neutral-400 uppercase tracking-widest">
                Belum ada data resto
              </div>
            )}
          </div>
        </div>
      )}
      {/* EDIT MERCHANT MODAL */}
      {editingMerchant && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[1.1rem] font-black">Edit Merchant</h3>
              <button onClick={() => setEditingMerchant(null)} className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form action={async (fd) => {
              setLoading(true);
              fd.append("lat", String(editingMerchant.lat ?? ""));
              fd.append("lng", String(editingMerchant.lng ?? ""));
              fd.append("area", editingMerchant.area);
              fd.append("address", editingMerchant.address || "");
              const res = await upsertMerchant(fd);
              setLoading(false);
              if (res.success) {
                const updated = await getAllMerchants();
                setMerchants(updated);
                setEditingMerchant(null);
              } else alert(res.error);
            }} className="space-y-3">
              <input name="name" required defaultValue={editingMerchant.name} placeholder="Nama Resto" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold outline-none" />
              <select name="category" defaultValue={editingMerchant.category} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold">
                <option value="Makanan">🍱 Food</option>
                <option value="Minuman">🥤 Drink</option>
                <option value="Snack">🍟 Snack</option>
                <option value="Paket">📦 Package</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input name="rating" type="number" step="0.1" defaultValue={editingMerchant.rating ?? ""} placeholder="Rating (e.g. 4.5)" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                <input name="reviews" type="number" defaultValue={editingMerchant.reviews ?? ""} placeholder="Review Count" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              </div>
              <div className="flex gap-4 items-center py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="promo_active" defaultChecked={editingMerchant.promo_active} className="w-5 h-5 rounded-lg" />
                  <span className="text-[0.85rem] font-bold">Promo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="pickup_fast" defaultChecked={editingMerchant.fast_pickup || editingMerchant.pickup_fast} className="w-5 h-5 rounded-lg" />
                  <span className="text-[0.85rem] font-bold">Fast Pickup</span>
                </label>
              </div>
              <input name="promo_percent" type="number" defaultValue={editingMerchant.promo_percent ?? ""} placeholder="Promo % (e.g. 20)" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              <label className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3 border border-neutral-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_open_24h" 
                  defaultChecked={editingMerchant.is_open_24h}
                  className="w-5 h-5 rounded-lg accent-neutral-900"
                  onChange={(e) => {
                    const grid = document.getElementById("edit_time_grid");
                    if (grid) grid.style.display = e.target.checked ? "none" : "grid";
                  }}
                />
                <span className="text-[0.85rem] font-bold text-neutral-700">Buka 24 Jam</span>
              </label>
              
              <div id="edit_time_grid" className="grid grid-cols-2 gap-3" style={{ display: editingMerchant.is_open_24h ? "none" : "grid" }}>
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Buka</p>
                  <input name="open_time" type="time" defaultValue={editingMerchant.open_time ?? ""} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Tutup</p>
                  <input name="close_time" type="time" defaultValue={editingMerchant.close_time ?? ""} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingMerchant(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 font-bold text-neutral-600">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-neutral-900 font-bold text-white disabled:opacity-50">
                  {loading ? "..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
