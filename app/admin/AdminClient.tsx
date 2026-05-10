"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Broadcast, BroadcastType } from "./actions";
import { createBroadcast, toggleBroadcast, deleteBroadcast } from "./actions";
import { upsertMerchant, toggleMerchantActive, getAllMerchants, type MerchantSignal } from "./actions/signals";
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
  const [activeTab, setActiveTab] = useState(NAV[0].id);
  const [merchants, setMerchants] = useState(initialMerchants);
  const [users, setUsers] = useState(initialUsers);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [area, setArea] = useState<string>("Locating...");
  const [pickedAddress, setPickedAddress] = useState("");
  const merchantFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`)
        .then(r => r.json())
        .then(data => {
          const areaName = data.address?.neighbourhood || data.address?.suburb || data.address?.city_district || "Unknown Area";
          setArea(areaName);
        });
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all ${activeTab === item.id ? "bg-neutral-900 text-white shadow-lg" : "bg-white text-neutral-500 border border-neutral-100"}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

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

      {activeTab === "merchants" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
            <h3 className="text-[0.9rem] font-bold mb-4">Manage Merchant</h3>
            <form ref={merchantFormRef} action={async (fd) => {
              fd.append("lat", String(lat)); fd.append("lng", String(lng)); fd.append("area", area);
              const res = await upsertMerchant(fd);
              if (res.success) { merchantFormRef.current?.reset(); const updated = await getAllMerchants(); setMerchants(updated); }
            }} className="space-y-4">
              <input name="name" required placeholder="Name" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, address) => {
                setLat(newLat); setLng(newLng); setPickedAddress(address);
              }} />
              
              <div className="grid grid-cols-2 gap-3">
                <select name="category" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]">
                  <option value="Makanan">Food</option>
                  <option value="Minuman">Drink</option>
                  <option value="Snack">Snack</option>
                  <option value="Paket">Parcel</option>
                </select>
                <select name="busy_score" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]">
                  <option value="5">Score 5 (Very Busy)</option>
                  <option value="4">Score 4 (Busy)</option>
                  <option value="3" selected>Score 3 (Normal)</option>
                  <option value="2">Score 2 (Quiet)</option>
                  <option value="1">Score 1 (Very Quiet)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input name="rating" type="number" step="0.1" placeholder="Rating (0-5)" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                <input name="reviews" type="number" placeholder="Review Count" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              </div>

              <div className="flex gap-5 pt-1">
                <label className="flex items-center gap-2"><input type="checkbox" name="promo_active" /> <span className="text-sm font-semibold">Promo</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="pickup_fast" /> <span className="text-sm font-semibold">Fast Pickup</span></label>
              </div>
              <button className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-2xl">Save Merchant</button>
            </form>
          </div>
          <div className="space-y-2">
            {merchants.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center">
                <div><p className="font-bold text-sm">{m.name}</p><p className="text-[0.7rem] text-neutral-400">{m.area} · Score {m.busy_score}</p></div>
                <button onClick={() => toggleMerchantActive(m.id, !m.is_active)} className={`text-[0.65rem] font-bold px-3 py-1.5 rounded-full ${m.is_active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"}`}>{m.is_active ? "Active" : "Inactive"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "radar" && (
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-[0.9rem] font-bold mb-4">Add Spot Mangkal</h3>
          <form action={async (fd) => {
            fd.append("lat", String(lat)); fd.append("lng", String(lng)); fd.append("area", area);
            const res = await saveNgetemSpot(fd);
            if (res.success) alert("Spot saved!");
          }} className="space-y-4">
            <input name="name" required placeholder="Spot Name" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
            
            <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng) => {
              setLat(newLat); setLng(newLng);
            }} />

            <div className="grid grid-cols-2 gap-3">
              <select name="quality" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]">
                <option value="Bagus">Good Quality</option>
                <option value="Lumayan">Medium Quality</option>
                <option value="Jebakan">Trap (Avoid)</option>
              </select>
              <input name="best_hours" placeholder="Best Hours (e.g. 11-13)" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
            </div>
            <textarea name="notes" placeholder="Additional Notes" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />
            <button className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-2xl">Save Radar Spot</button>
          </form>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {users.map(u => (
            <div key={u.id} className={`bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex flex-col gap-3 ${u.is_disabled ? "opacity-60 bg-neutral-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500">{u.nama?.[0] || "?"}</div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{u.nama || "Unknown"}</p>
                  <p className="text-[0.7rem] text-neutral-400">{u.email} · ID: {u.driver_id || "-"}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${new Date().getTime() - new Date(u.last_active).getTime() < 300000 ? "bg-emerald-500" : "bg-neutral-300"}`} />
                </div>
              </div>
              <div className="flex gap-2 border-t border-neutral-50 pt-3">
                <button 
                  onClick={async () => {
                    const res = await toggleUserDisabled(u.id, !u.is_disabled);
                    if (res.success) setUsers(prev => prev.map(x => x.id === u.id ? {...x, is_disabled: !u.is_disabled} : x));
                  }}
                  className={`flex-1 py-2 rounded-xl text-[0.7rem] font-bold ${u.is_disabled ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                >
                  {u.is_disabled ? "Reactivate" : "Disable"}
                </button>
                <button 
                  onClick={async () => {
                    if (confirm("Delete user permanently?")) {
                      const res = await deleteUserAccount(u.id);
                      if (res.success) setUsers(prev => prev.filter(x => x.id !== u.id));
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-[0.7rem] font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {initialFeedback.length === 0 && <p className="text-center text-neutral-400 py-10">No feedback yet.</p>}
          {initialFeedback.map(f => (
            <div key={f.id} className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-sm">{f.users?.nama || "User"}</p>
                <span className="text-[0.65rem] text-neutral-400">{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-[0.85rem] text-neutral-600 leading-relaxed">{f.message}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "broadcast" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
            <h3 className="text-[0.9rem] font-bold mb-4">New Broadcast (Expires 10m)</h3>
            <form action={createBroadcast} className="space-y-3">
              <input name="title" required placeholder="Title" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              <textarea name="message" required placeholder="Message" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={3} />
              <select name="type" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]">
                <option value="spot_ramai">Spot Ramai</option>
                <option value="hindari_area">Hindari Area</option>
              </select>
              <button className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-2xl">Broadcast to All</button>
            </form>
          </div>
          <div className="space-y-2">
            {broadcasts.map(b => (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{b.title}</p>
                  <p className="text-[0.65rem] text-neutral-400">
                    {b.expires_at ? `Expires: ${new Date(b.expires_at).toLocaleTimeString()}` : "No expiry"}
                  </p>
                </div>
                <button onClick={() => deleteBroadcast(b.id)} className="text-[0.65rem] font-bold text-red-500 p-2">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
