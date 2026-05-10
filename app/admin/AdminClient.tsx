"use client";

import { useState, useEffect, useRef } from "react";
import type { Broadcast, BroadcastType } from "./actions";
import { createBroadcast, toggleBroadcast, deleteBroadcast } from "./actions";
import { reportManualDensity, reportMerchantSignal } from "./actions/signals";
import { saveFounderNote, saveNgetemSpot } from "./actions/notes";

type Props = {
  broadcasts: Broadcast[];
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

export function AdminClient({ broadcasts }: Props) {
  const [activeTab, setActiveTab] = useState<"broadcast" | "density" | "merchant" | "notes" | "spots">("broadcast");
  const [advancedMode, setAdvancedMode] = useState(false);
  const notesFormRef = useRef<HTMLFormElement>(null);
  const spotsFormRef = useRef<HTMLFormElement>(null);
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
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        <button onClick={() => setActiveTab("broadcast")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all ${ activeTab === "broadcast" ? "bg-neutral-900 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>Broadcast</button>
        <button onClick={() => setActiveTab("density")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all ${ activeTab === "density" ? "bg-blue-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>Kepadatan</button>
        <button onClick={() => setActiveTab("merchant")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all ${ activeTab === "merchant" ? "bg-orange-500 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>Sinyal Resto</button>
        <button onClick={() => setActiveTab("spots")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all ${ activeTab === "spots" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>Spot Ngetem</button>
        <button onClick={() => setActiveTab("notes")} className={`shrink-0 px-4 py-2.5 rounded-2xl text-[0.85rem] font-bold transition-all ${ activeTab === "notes" ? "bg-purple-600 text-white shadow-md" : "bg-white text-neutral-500 border border-neutral-200" }`}>Catatan</button>
      </div>

      {/* GPS Status Indicator for forms */}
      {(activeTab === "density" || activeTab === "merchant") && (
        <div className="mb-4 flex items-center justify-between bg-neutral-100 rounded-2xl p-3 border border-neutral-200">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${lat ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
            <span className="text-[0.75rem] font-bold text-neutral-600">GPS Sensor</span>
          </div>
          <span className="text-[0.75rem] font-semibold text-neutral-900 truncate max-w-[150px]">{area}</span>
        </div>
      )}

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
      {activeTab === "density" && (
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400 mb-4">Manual Density Input</h2>
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
      )}

      {/* 3. MERCHANT TAB */}
      {activeTab === "merchant" && (
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-400">Manual Merchant Signal</h2>
            <button 
              onClick={() => setAdvancedMode(!advancedMode)} 
              className={`text-[0.7rem] font-bold px-2 py-1 rounded-md transition-colors ${advancedMode ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'}`}
            >
              Mode Mahir
            </button>
          </div>
          <form action={async (formData) => {
            formData.append("lat", String(lat));
            formData.append("lng", String(lng));
            formData.append("area", area);
            await reportMerchantSignal(formData);
            alert("Sinyal restoran disimpan!");
          }} className="space-y-4">
            <div>
              <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Nama Resto</label>
              <input name="name" required placeholder="cth: Gacoan Seturan" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Tingkat Ramai</label>
                <select name="busy_level" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High" selected>High</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Kategori</label>
                <select name="category" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:outline-none focus:border-orange-400 transition">
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="promo_active" className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500" />
                <span className="text-[0.85rem] font-semibold text-neutral-700">Promo Aktif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="fast_pickup" className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500" />
                <span className="text-[0.85rem] font-semibold text-neutral-700">Pickup Cepat</span>
              </label>
            </div>

            {advancedMode && (
              <div className="pt-3 border-t border-dashed border-neutral-200 mt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Rating (1-5)</label>
                    <input name="rating" type="number" step="0.1" placeholder="4.8" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:border-orange-400 focus:outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Jml Ulasan</label>
                    <input name="reviews" type="number" placeholder="100+" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:border-orange-400 focus:outline-none transition" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Estimasi Waktu (Menit)</label>
                    <input name="eta_minutes" type="number" placeholder="15" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:border-orange-400 focus:outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Jarak (Km)</label>
                    <input name="distance_km" type="number" step="0.1" placeholder="2.5" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[0.9rem] text-neutral-900 focus:border-orange-400 focus:outline-none transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Teks Diskon Tambahan</label>
                  <input name="discount_text" type="text" placeholder="Diskon 50% max 20rb" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:border-orange-400 focus:outline-none transition" />
                </div>

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="free_shipping" className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500" />
                    <span className="text-[0.85rem] font-semibold text-neutral-700">Gratis Ongkir</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[0.8rem] font-semibold text-neutral-600 mb-1.5">Catatan Khusus</label>
                  <textarea name="notes" rows={2} placeholder="Parkir susah, pesanan numpuk..." className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[0.95rem] text-neutral-900 focus:border-orange-400 focus:outline-none transition resize-none"></textarea>
                </div>
              </div>
            )}

            <button type="submit" className="w-full rounded-2xl bg-orange-500 py-3.5 text-[0.95rem] font-bold text-white transition active:scale-[0.98] hover:bg-orange-600 mt-2">
              Kirim Info Resto (60 Menit)
            </button>
          </form>
        </div>
      )}

      {/* 4. SPOT NGETEM TAB */}
      {activeTab === "spots" && (
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-neutral-100 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
