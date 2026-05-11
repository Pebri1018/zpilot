"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Broadcast } from "./actions";
import { createBroadcast, deleteBroadcast } from "./actions";
import { upsertMerchant, toggleMerchantActive, getAllMerchants, deleteMerchant, type MerchantSignal } from "./actions/signals";
import { saveNgetemSpot } from "./actions/notes";
import { toggleUserDisabled, deleteUserAccount } from "./actions/admin_data";
import { useLanguage } from "@/context/LanguageContext";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

type Props = {
  broadcasts: Broadcast[];
  initialMerchants?: MerchantSignal[];
  initialUsers?: any[];
  initialFeedback?: any[];
  stats: { users: number; feedback: number; signals: number };
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { id: "merchants", label: "Merchants", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: "radar", label: "Radar Spots", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { id: "users", label: "Users", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  { id: "feedback", label: "Feedback", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg> },
  { id: "broadcast", label: "Broadcast", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
];

export function AdminClient({ broadcasts, initialMerchants = [], initialUsers = [], initialFeedback = [], stats }: Props) {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [merchantMode, setMerchantMode] = useState<"quick" | "detail">("quick");
  const [merchants, setMerchants] = useState(initialMerchants);
  const [users, setUsers] = useState(initialUsers);
  const [editingMerchant, setEditingMerchant] = useState<any | null>(null);
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
      {/* Admin Nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-5 sticky top-[max(1.25rem,env(safe-area-inset-top))] z-40 bg-[#f7f7f8]/95 backdrop-blur-xl pt-2 pb-4 -mx-5 border-b border-neutral-200/50">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center justify-center md:justify-start gap-2 shrink-0 px-3 py-3 rounded-2xl text-[0.8rem] md:text-[0.85rem] font-bold transition-all ${activeTab === item.id ? "bg-neutral-900 text-white shadow-lg" : "bg-white text-neutral-500 border border-neutral-100 active:bg-neutral-50"}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm">
            <p className="text-[0.7rem] font-bold uppercase text-neutral-400 mb-1">Users</p>
            <p className="text-[1.8rem] font-black">{stats.users}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm">
            <p className="text-[0.7rem] font-bold uppercase text-neutral-400 mb-1">Pending Feedback</p>
            <p className="text-[1.8rem] font-black">{stats.feedback}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm col-span-2">
            <p className="text-[0.7rem] font-bold uppercase text-neutral-400 mb-1">Active Signals</p>
            <p className="text-[1.8rem] font-black">{stats.signals}</p>
          </div>
        </div>
      )}

      {/* 2. MERCHANTS */}
      {activeTab === "merchants" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1.1rem] font-black tracking-tight">{t("manage_merchants")}</h3>
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
              <input name="name" required placeholder={t("merchant_name")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold focus:border-neutral-900 focus:bg-white transition-all outline-none" />
              
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
                setLat(newLat); setLng(newLng); setAddress(addr); setArea(ar);
              }} />

              {merchantMode === "detail" && (
                <>
                  <select name="category" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold">
                    <option value="Makanan">🍱 Food</option>
                    <option value="Minuman">🥤 Drink</option>
                    <option value="Snack">🍟 Snack</option>
                    <option value="Paket">📦 Package</option>
                  </select>
                  <textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("address")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input name="rating" type="number" step="0.1" placeholder={t("rating")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                <input name="reviews" type="number" placeholder={t("reviews")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
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
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" name="pickup_fast" className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-0" />
                      <span className="text-[0.85rem] font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors">{t("fast_pickup")}</span>
                    </label>
                  )}
                </div>
                <div id="promo_percent_container" style={{ display: "none" }}>
                  <input name="promo_percent" type="number" placeholder="Promo Percent (e.g. 20, 40)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                </div>
              </div>

              <button disabled={loading} className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[1.05rem]">
                {loading ? "..." : t("save_merchant")}
              </button>
            </form>
          </div>

          {/* Merchant List */}
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
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {merchants
              .filter(m => filterLevel === "All" || m.busy_level === filterLevel)
              .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.area.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(m => (
              <div key={m.id} className={`bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col gap-4 ${!m.is_active ? "opacity-60 grayscale" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-[1.05rem] tracking-tight">{m.name}</p>
                    <p className="text-[0.75rem] text-neutral-400 font-bold">{m.area}</p>
                  </div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-[0.85rem] shadow-sm ${m.busy_level === 'High' ? 'bg-red-50 text-red-600' : m.busy_level === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {m.popularity_score || m.busy_score}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-neutral-50 rounded-xl p-2.5">
                    <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Rating / Reviews</p>
                    <p className="text-[0.85rem] font-black text-neutral-800">⭐ {m.rating || "-"} <span className="text-neutral-400 font-semibold">({m.reviews || 0})</span></p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-2.5">
                    <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Promo</p>
                    <p className="text-[0.85rem] font-black text-neutral-800">{m.promo_active ? (m.promo_percent ? `${m.promo_percent}% OFF` : "Active") : "None"}</p>
                  </div>
                </div>
                <p className="text-[0.65rem] text-neutral-400 font-semibold italic text-center -mt-1">
                  Updated: {new Date(m.updated_at || m.created_at).toLocaleString()}
                </p>

                <div className="flex gap-2 border-t border-neutral-50 pt-3">
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
            ))}
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
                    {new Date(f.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-[0.9rem] text-neutral-700 leading-relaxed font-medium italic mt-2">"{f.message}"</p>
                {f.status && (
                  <span className={`inline-block mt-2 text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                    f.status === "reviewed" ? "bg-green-50 text-green-600" : f.status === "closed" ? "bg-neutral-100 text-neutral-400" : "bg-orange-50 text-orange-600"
                  }`}>{f.status}</span>
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
                    {b.expires_at ? `Exp: ${new Date(b.expires_at).toLocaleTimeString()}` : "Permanent"}
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
