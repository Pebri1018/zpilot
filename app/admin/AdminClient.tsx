"use client";

import { useState, useEffect, useRef } from "react";
import type { Broadcast, BroadcastType } from "./actions";
import { createBroadcast, toggleBroadcast, deleteBroadcast } from "./actions";
import { reportManualDensity, upsertMerchant, toggleMerchantActive, getAllMerchants, type MerchantSignal } from "./actions/signals";
import { saveFounderNote, saveNgetemSpot } from "./actions/notes";

type Props = {
  broadcasts: Broadcast[];
  initialMerchants?: MerchantSignal[];
};

const TYPE_META: Record<BroadcastType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  spot_ramai: {
    label: "Spot Ramai",
    color: "#00A651",
    bg: "#00A65112",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  hindari_area: {
    label: "Hindari Area",
    color: "#EF4444",
    bg: "#EF444412",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  promo_seller: {
    label: "Promo Seller",
    color: "#F97316",
    bg: "#F9731612",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  paket_spx: {
    label: "Paket SPX",
    color: "#3B82F6",
    bg: "#3B82F612",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  cuaca_event: {
    label: "Cuaca / Event",
    color: "#8B5CF6",
    bg: "#8B5CF612",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
};

export function AdminClient({ broadcasts, initialMerchants = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "merchants" | "radar_spots" | "users" | "feedback" | "broadcast">("dashboard");
  const [advancedMode, setAdvancedMode] = useState(false);
  const notesFormRef = useRef<HTMLFormElement>(null);
  const spotsFormRef = useRef<HTMLFormElement>(null);
  const merchantFormRef = useRef<HTMLFormElement>(null);
  const [merchants, setMerchants] = useState<MerchantSignal[]>(initialMerchants);
  const [savingMerchant, setSavingMerchant] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [area, setArea] = useState<string>("Mengambil lokasi...");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await response.json();
          const areaName = data.address?.neighbourhood || data.address?.suburb || data.address?.village || data.address?.city_district || "Area tidak diketahui";
          setArea(areaName);
        } catch {
          setArea("Area tidak diketahui");
        }
      },
      () => setArea("Gagal mengambil GPS"),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <>
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2 -mx-5 px-5">
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        <button onClick={() => setActiveTab("dashboard")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all flex items-center gap-2 ${ activeTab === "dashboard" ? "bg-neutral-900 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Dashboard
        </button>
        <button onClick={() => setActiveTab("merchants")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all flex items-center gap-2 ${ activeTab === "merchants" ? "bg-orange-500 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Merchants
        </button>
        <button onClick={() => setActiveTab("radar_spots")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all flex items-center gap-2 ${ activeTab === "radar_spots" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Radar Spots
        </button>
        <button onClick={() => setActiveTab("users")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all flex items-center gap-2 ${ activeTab === "users" ? "bg-blue-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          Users
        </button>
        <button onClick={() => setActiveTab("feedback")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all flex items-center gap-2 ${ activeTab === "feedback" ? "bg-purple-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Feedback
        </button>
        <button onClick={() => setActiveTab("broadcast")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all flex items-center gap-2 ${ activeTab === "broadcast" ? "bg-red-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Broadcast
        </button>
      </div>

      {/* GPS Bar — always visible */}
      <div className="mb-4 flex items-center justify-between bg-neutral-100 rounded-2xl p-3 border border-neutral-200">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${lat ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
          <span className="text-[0.75rem] font-bold text-neutral-600">GPS</span>
        </div>
        <span className="text-[0.75rem] font-semibold text-neutral-900 truncate max-w-[200px]">{area}</span>
      </div>

      {/* 1. BROADCAST TAB */}
      {activeTab === "broadcast" && (
        <div>
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100 mb-8">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400 mb-4">Buat Broadcast Baru</h2>
            <form action={createBroadcast} className="space-y-4">
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Judul</label>
                <input
                  name="title" required placeholder="cth: Area Malioboro Sedang Padat"
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition"
                />
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Pesan</label>
                <textarea
                  name="message" required rows={3} placeholder="Pesan singkat..."
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Tipe</label>
                <select name="type" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-neutral-400 transition">
                  <option value="">-- Pilih tipe --</option>
                  <option value="spot_ramai">Spot Ramai</option>
                  <option value="hindari_area">Hindari Area</option>
                  <option value="promo_seller">Promo Seller</option>
                  <option value="paket_spx">Paket SPX</option>
                  <option value="cuaca_event">Cuaca / Event</option>
                </select>
              </div>
              <button type="submit" className="w-full rounded-2xl bg-neutral-900 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-neutral-800">
                Kirim ke Semua Driver
              </button>
            </form>
          </div>

          <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400 mb-4">Riwayat ({broadcasts.length})</h2>
          <div className="space-y-3">
            {broadcasts.length === 0 && <p className="text-center text-neutral-400 text-[0.9rem] py-8">Belum ada broadcast.</p>}
            {broadcasts.map((b) => {
              const meta = TYPE_META[b.type];
              return (
                <div key={b.id} className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${b.active ? "border-neutral-100" : "opacity-50 border-neutral-100"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                      {b.active && <span className="text-[0.65rem] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <form action={async () => { await toggleBroadcast(b.id, !b.active); }}>
                        <button type="submit" className={`text-[0.7rem] font-bold px-2.5 py-1 rounded-full transition active:scale-95 ${b.active ? "bg-neutral-100 text-neutral-600" : "bg-green-100 text-green-700"}`}>
                          {b.active ? "Off" : "On"}
                        </button>
                      </form>
                      <form action={async () => { await deleteBroadcast(b.id); }}>
                        <button type="submit" className="text-[0.7rem] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500 transition active:scale-95">Hapus</button>
                      </form>
                    </div>
                  </div>
                  <p className="font-bold text-neutral-900 text-[0.95rem] mt-1">{b.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DENSITY TAB */}
      {activeTab === "radar_spots" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Manual Density Input */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-blue-600 mb-4">Manual Density Input</h2>
            <form action={async (formData) => {
              formData.append("lat", String(lat));
              formData.append("lng", String(lng));
              formData.append("area", area);
              await reportManualDensity(formData);
              alert("Laporan kepadatan disimpan!");
            }} className="space-y-4">
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Jumlah Driver Terlihat</label>
                <input name="driver_count" type="number" required placeholder="0" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[1.1rem] font-bold text-neutral-900 focus:outline-none focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Radius (Meter)</label>
                <select name="radius" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-blue-400 transition">
                  <option value="25">25m</option>
                  <option value="50" selected>50m</option>
                  <option value="100">100m</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Catatan (Opsional)</label>
                <input name="notes" placeholder="cth: Ngetem di depan Mixue" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-blue-400 transition" />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-blue-600 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-blue-700">
                Kirim Sinyal Area (20 Menit)
              </button>
            </form>
          </div>

          {/* Add Ngetem Spot */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-emerald-600 mb-4">Tambah Spot Ngetem</h2>
            <form
              ref={spotsFormRef}
              action={async (formData) => {
                formData.append("lat", String(lat));
                formData.append("lng", String(lng));
                const result = await saveNgetemSpot(formData);
                if (result?.success) {
                  alert("Spot ngetem disimpan!");
                  spotsFormRef.current?.reset();
                } else {
                  alert(result?.error || "Gagal menyimpan.");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Nama Spot</label>
                <input name="name" required placeholder="cth: Depan Mixue Seturan" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-emerald-400 transition" />
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Area / Zona</label>
                <input name="area" required placeholder={area} defaultValue={area !== "Mengambil lokasi..." ? area : ""} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-emerald-400 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Kualitas Spot</label>
                  <select name="quality" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-emerald-400 transition">
                    <option value="Bagus">✅ Bagus</option>
                    <option value="Lumayan">🟡 Lumayan</option>
                    <option value="Jebakan">❌ Jebakan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Jam Terbaik</label>
                  <input name="best_hours" placeholder="cth: 11:00-13:00" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-emerald-400 transition" />
                </div>
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Catatan Tambahan</label>
                <textarea name="notes" rows={2} placeholder="cth: Parkir luas, banyak pesanan Gacoan..." className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:border-emerald-400 focus:outline-none transition resize-none"></textarea>
              </div>
              <button type="submit" className="w-full rounded-2xl bg-emerald-600 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-emerald-700">
                Simpan Spot Ngetem
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MERCHANTS TAB */}
      {activeTab === "merchants" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Add / Update Form */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-orange-500 mb-4">Tambah / Update Restoran</h2>
            <form
              ref={merchantFormRef}
              action={async (formData) => {
                setSavingMerchant(true);
                formData.append("lat", String(lat));
                formData.append("lng", String(lng));
                formData.append("area", area);
                const result = await upsertMerchant(formData);
                setSavingMerchant(false);
                if (result?.success) {
                  merchantFormRef.current?.reset();
                  // Refresh list
                  const updated = await getAllMerchants();
                  setMerchants(updated);
                  alert("✅ Restoran disimpan dan langsung muncul di Home!");
                } else {
                  alert(result?.error || "Gagal menyimpan");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Nama Restoran *</label>
                <input name="name" required placeholder="cth: Gacoan Seturan" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Kategori</label>
                  <select name="category" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition">
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                    <option value="Paket">Paket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Rating</label>
                  <input name="rating" type="number" step="0.1" min="0" max="5" placeholder="4.5" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Jumlah Review</label>
                  <input name="review_count" type="number" placeholder="1000" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition" />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Busy Score (1-5)</label>
                  <input name="busy_score" type="number" min="1" max="5" defaultValue="3" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition" />
                </div>
              </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Busy Score (1-5)</label>
                  <select name="busy_score" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition">
                    <option value="5">🔥 5 — Sangat Ramai</option>
                    <option value="4">⚡ 4 — Ramai</option>
                    <option value="3" selected>🟡 3 — Normal</option>
                    <option value="2">🔵 2 — Sepi</option>
                    <option value="1">⬜ 1 — Sangat Sepi</option>
                  </select>
                </div>
              </div>

              {/* Area field — auto-filled from GPS */}
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1">Area (auto-GPS)</label>
                <input
                  name="area_override"
                  placeholder={area}
                  defaultValue={area !== "Mengambil lokasi..." ? area : ""}
                  onChange={(e) => { /* area is appended via formData.append separately */ }}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition"
                />
                <p className="text-[0.7rem] text-neutral-400 mt-1 ml-1">Kosongkan untuk pakai GPS otomatis</p>
              </div>

              <div className="flex gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="promo_active" className="w-4 h-4 accent-orange-500" />
                  <span className="text-[0.88rem] font-semibold text-neutral-700">🏷️ Promo Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="pickup_fast" className="w-4 h-4 accent-orange-500" />
                  <span className="text-[0.88rem] font-semibold text-neutral-700">⚡ Pickup Cepat</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingMerchant}
                className="w-full rounded-2xl bg-orange-500 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-orange-600 disabled:opacity-60"
              >
                {savingMerchant ? "Menyimpan..." : "Simpan Restoran (Permanen)"}
              </button>
            </form>
          </div>

          {/* Merchant List */}
          {merchants.length > 0 && (
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400 mb-2 ml-1">Semua Restoran ({merchants.length})</p>
              <div className="space-y-2">
                {merchants.map(m => (
                  <div key={m.id} className={`bg-white rounded-2xl p-3.5 border shadow-sm flex items-center gap-3 transition ${m.is_active ? 'border-neutral-100' : 'opacity-50 border-neutral-200'}`}>
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-extrabold text-[1rem] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[0.88rem] text-neutral-900 truncate">{m.name}</p>
                      <p className="text-[0.72rem] text-neutral-500">{m.area} · {m.category} · Score {m.busy_score ?? '—'}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await toggleMerchantActive(m.id, !m.is_active);
                        setMerchants(prev => prev.map(x => x.id === m.id ? {...x, is_active: !m.is_active} : x));
                      }}
                      className={`shrink-0 text-[0.7rem] font-bold px-2.5 py-1 rounded-full transition active:scale-95 ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      {m.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SPOT NGETEM TAB */}


      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-neutral-900">{merchants.length}</div>
                <div className="text-[0.8rem] text-neutral-600">Active Merchants</div>
              </div>
              <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-neutral-900">{broadcasts.length}</div>
                <div className="text-[0.8rem] text-neutral-600">Active Broadcasts</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-[0.9rem] text-neutral-600">Real-time operational data for ZTIPS drivers</p>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-blue-600 mb-4">User Management</h2>
            <p className="text-[0.9rem] text-neutral-600">User management features coming soon...</p>
          </div>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {activeTab === "feedback" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-purple-600 mb-4">User Feedback</h2>
            <p className="text-[0.9rem] text-neutral-600">Feedback management features coming soon...</p>
          </div>
        </div>
      )}

      {/* 5. CATATAN FOUNDER TAB */}
      {activeTab === "notes" && (
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-purple-600 mb-4">Catatan Lapangan</h2>
          <form
            ref={notesFormRef}
            action={async (formData) => {
              formData.append("lat", String(lat));
              formData.append("lng", String(lng));
              formData.append("area", area);
              const result = await saveFounderNote(formData);
              if (result?.success) {
                alert("Catatan disimpan!");
                notesFormRef.current?.reset();
              } else {
                alert(result?.error || "Gagal menyimpan.");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Tipe Catatan</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "spot_bagus", label: "✅ Spot Bagus", color: "emerald" },
                  { value: "jebakan", label: "❌ Jebakan", color: "red" },
                  { value: "merchant_ramai", label: "🔥 Merchant Ramai", color: "orange" },
                  { value: "lainnya", label: "📝 Lainnya", color: "neutral" },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 p-2.5 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition">
                    <input type="radio" name="type" value={opt.value} defaultChecked={opt.value === "spot_bagus"} className="w-4 h-4" />
                    <span className="text-[0.82rem] font-semibold text-neutral-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Catatan</label>
              <textarea
                name="notes"
                required
                rows={3}
                placeholder="cth: Depan Mixue Seturan pagi ini sangat ramai, 10+ driver ngetem..."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:border-purple-400 focus:outline-none transition resize-none"
              ></textarea>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 rounded-xl px-3 py-2 text-[0.75rem] font-medium">
              <div className={`w-2 h-2 rounded-full ${lat ? 'bg-purple-500' : 'bg-neutral-400'}`} />
              {lat ? `GPS terkunci: ${area}` : "GPS belum aktif, lokasi tidak akan disimpan"}
            </div>
            <button type="submit" className="w-full rounded-2xl bg-purple-600 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-purple-700">
              Simpan Catatan
            </button>
          </form>
        </div>
      )}
    </>
  );
}
