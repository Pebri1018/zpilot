"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Broadcast } from "./actions";
import { createBroadcast, deleteBroadcast } from "./actions";
import { upsertMerchant, toggleMerchantActive, getAllMerchants, deleteMerchant, type MerchantSignal } from "./actions/signals";
import { saveNgetemSpot } from "./actions/notes";
import { toggleUserDisabled, deleteUserAccount, replyFeedback, deleteManualSignal, addManualSignal } from "./actions/admin_data";
import { useLanguage } from "@/context/LanguageContext";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

type Props = {
  broadcasts: Broadcast[];
  initialMerchants?: MerchantSignal[];
  initialSpots?: any[];
  initialUsers?: any[];
  initialFeedback?: any[];
  stats: { users: number; feedback: number; signals: number; resto: number; seller: number; spots: number };
  hotspots?: any[];
  initialSignals?: any[];
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

export function AdminClient({ broadcasts, initialMerchants = [], initialSpots = [], initialUsers = [], initialFeedback = [], stats, hotspots = [], initialSignals = [] }: Props) {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [merchantMode, setMerchantMode] = useState<"quick" | "detail">("quick");
  const [merchants, setMerchants] = useState(initialMerchants);
  const [spots, setSpots] = useState(initialSpots);
  const [users, setUsers] = useState(initialUsers);
  const [signals, setSignals] = useState(initialSignals);
  const [editingMerchant, setEditingMerchant] = useState<any | null>(null);
  const [editingSpot, setEditingSpot] = useState<any | null>(null);
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [editSpotLat, setEditSpotLat] = useState<number | null>(null);
  const [editSpotLng, setEditSpotLng] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<any>(null);

  const parseShopeeScreenshotText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let name = "";
    let rating = 0;
    let promo = 0;
    let freeDelivery = false;
    let eta = 0;
    let category = "Makanan";

    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      if (line.match(/ShopeeFood/i) || line.match(/Voucher/i) || line.match(/Promo/i) || line.match(/Diskon/i)) continue;
      if (line.length > 4 && !line.match(/^\d+\.?\d*$/) && !line.includes(":")) {
        name = line;
        break;
      }
    }

    const ratingMatch = text.match(/([345]\.[0-9])/);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);

    const promoMatch = text.match(/(\d+)%/);
    if (promoMatch) promo = parseInt(promoMatch[1]);

    if (text.toLowerCase().includes("gratis ongkir") || text.toLowerCase().includes("ongkir rp0") || text.toLowerCase().includes("free delivery")) {
      freeDelivery = true;
    }

    const etaMatch = text.match(/(\d+)\s*(menit|mins)/i);
    if (etaMatch) eta = parseInt(etaMatch[1]);

    const lower = text.toLowerCase();
    if (lower.includes("minuman") || lower.includes("drink") || lower.includes("kopi") || lower.includes("tea") || lower.includes("boba")) category = "Minuman";
    else if (lower.includes("snack") || lower.includes("cemilan") || lower.includes("keripik") || lower.includes("roti")) category = "Snack";

    return { name, rating, promo, freeDelivery, eta, category };
  };

  const handleImageUpload = async (file: File) => {
    setOcrLoading(true);
    setPreviewImage(URL.createObjectURL(file));
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker('ind');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const parsed = parseShopeeScreenshotText(text);
      setDetectedData(parsed);
    } catch (e) {
      console.error("OCR Error", e);
      alert("Gagal membaca gambar.");
    } finally {
      setOcrLoading(false);
    }
  };

  useEffect(() => {
    if (editingMerchant) {
      setEditLat(editingMerchant.lat);
      setEditLng(editingMerchant.lng);
    }
  }, [editingMerchant]);

  useEffect(() => {
    if (editingSpot) {
      setEditSpotLat(editingSpot.lat);
      setEditSpotLng(editingSpot.lng);
    }
  }, [editingSpot]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("All");
  const [completenessFilter, setCompletenessFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const merchantFormRef = useRef<HTMLFormElement>(null);

  const getCompleteness = (m: MerchantSignal) => {
    const isSeller = ["Paket", "Toko/Seller", "Seller SPX"].includes(m.category);
    const hasLocation = !!m.lat && !!m.lng;
    const hasCategory = !!m.category && m.category !== "";
    const hasPromo = m.promo_active === true || ((m.promo_percent ?? 0) > 0);
    const hasHours = m.is_open_24h || (!!m.open_time && !!m.close_time);

    if (isSeller) {
      // Sellers: Cukup Lokasi + Kategori saja sudah dianggap Complete
      if (hasLocation && hasCategory) return "Complete";
      return "Basic";
    }

    // Restos: Tetap butuh Promo & Jam Buka agar Complete
    if (hasLocation && hasCategory && hasPromo && hasHours) return "Complete";
    if (hasLocation && hasCategory) return "Partial";
    return "Basic";
  };

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
              <button onClick={() => setActiveTab("screenshot_import")} className="w-full flex items-center gap-3 px-5 py-4.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition bg-blue-50/30">
                <span className="text-[1.2rem]">📸</span>
                <div className="flex flex-col">
                  <span className="text-[0.95rem] font-bold text-blue-600">Import via Screenshot</span>
                  <span className="text-[0.65rem] font-bold text-blue-400 uppercase tracking-tight">Auto OCR ShopeeFood</span>
                </div>
                <svg className="w-4 h-4 text-blue-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SPOTS LIST */}
      {activeTab === "spots_list" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {spots.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {s.short_id && <span className="text-[0.65rem] font-black bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">#{s.short_id}</span>}
                    <p className="font-black text-[1.05rem] tracking-tight">{s.name}</p>
                  </div>
                  <p className="text-[0.75rem] text-neutral-400 font-bold">{s.area}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSpot(s)}
                    className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Hapus spot ini?")) {
                        const { deleteNgetemSpot } = await import("./actions/notes");
                        const res = await deleteNgetemSpot(s.id);
                        if (res.success) setSpots(spots.filter(sp => sp.id !== s.id));
                        else alert(res.error);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-neutral-50 rounded-xl p-2.5">
                  <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Kualitas</p>
                  <p className="text-[0.85rem] font-black text-neutral-800">{s.quality}</p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-2.5">
                  <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Jam Terbaik</p>
                  <p className="text-[0.85rem] font-black text-neutral-800">{s.best_hours || "-"}</p>
                </div>
              </div>
              {s.notes && <p className="text-[0.8rem] text-neutral-600 font-medium px-2 italic">"{s.notes}"</p>}
            </div>
          ))}
          {spots.length === 0 && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center">
              <p className="text-neutral-500 font-bold">Belum ada data spot.</p>
            </div>
          )}
        </div>
      )}
      
      {/* 5.5 SIGNALS LIST */}
      {activeTab === "signals_list" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {signals.length === 0 && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center">
              <p className="text-neutral-500 font-bold">Belum ada sinyal manual aktif.</p>
            </div>
          )}
          {signals.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-[1.05rem] tracking-tight">{s.type === "driver_ngetem" ? "Sinyal Ngetem" : "Sinyal Antar"}</p>
                    <span className="text-[0.65rem] font-black bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">+{s.count}</span>
                  </div>
                  <p className="text-[0.7rem] text-neutral-400 font-bold tracking-wide">Exp: {new Date(s.expires_at).toLocaleTimeString()}</p>
                </div>
                <button 
                  onClick={async () => {
                    if (confirm("Hapus sinyal manual ini?")) {
                      const { deleteManualSignal } = await import("@/app/admin/actions/admin_data");
                      await deleteManualSignal(s.id);
                      setSignals(prev => prev.filter(x => x.id !== s.id));
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[0.75rem] font-bold hover:bg-red-100 transition-colors shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
              
              <div className="flex flex-col gap-1.5 mb-2">
                <input 
                  type="text" 
                  placeholder="Atau Paste Link Gmaps / Titik Koordinat (-6.xxx, 106.xxx)" 
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (!val.trim()) return;

                    if (val.includes("http") || val.includes("goo.gl") || val.includes("maps")) {
                      setLoading(true);
                      const { resolveGmapsLink } = await import("@/app/admin/actions/signals");
                      const coords = await resolveGmapsLink(val);
                      setLoading(false);
                      if (coords.lat && coords.lng) {
                        setLat(coords.lat);
                        setLng(coords.lng);
                      } else {
                        alert("Gagal mendeteksi koordinat dari link: " + (coords.error || ""));
                      }
                      return;
                    }

                    const coords = val.split(",");
                    if (coords.length >= 2) {
                      const newLat = parseFloat(coords[0].replace(/[^0-9.-]/g, ""));
                      const newLng = parseFloat(coords[1].replace(/[^0-9.-]/g, ""));
                      if (!isNaN(newLat) && !isNaN(newLng)) {
                        setLat(newLat);
                        setLng(newLng);
                      }
                    }
                  }}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] focus:outline-none"
                />
              </div>

              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
                setLat(newLat); setLng(newLng);
                if (addr) setAddress(addr);
                if (ar) setArea(ar);
              }} />
              <div className="grid grid-cols-2 gap-3">
                <input name="area" required value={area} onChange={e => setArea(e.target.value)} placeholder="Kecamatan / Area (Wajib)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold" />
                <input value={`${lat || ''}, ${lng || ''}`} readOnly placeholder="Koordinat" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] text-neutral-500 font-mono focus:outline-none" />
              </div>
              {merchantMode === "detail" && (
                <>
                  <select name="category" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold">
                    <option value="Makanan">🍱 Food / Resto</option>
                    <option value="Minuman">🥤 Drink</option>
                    <option value="Snack">🍟 Snack</option>
                  </select>
                  <textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("address")} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />

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
                        <input name="open_time" type="time" lang="en-GB" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                      </div>
                      <div>
                        <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Tutup</p>
                        <input name="close_time" type="time" lang="en-GB" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                      </div>
                    </div>
                    <input name="closed_days" placeholder="Hari Libur (opsional, misal: Senin, Minggu)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold mt-1" />
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" name="free_shipping" className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-0" />
                        <span className="text-[0.85rem] font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors">Diskon Ongkir</span>
                      </label>
                    </div>
                    <div>
                      <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Promo Persen (%)</p>
                      <input name="promo_percent" type="number" placeholder="Contoh: 20, 40" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                    </div>
                  </div>

                  </div>
                </>
              )}

              <button disabled={loading} className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-[1.05rem]">
                {loading ? "..." : "Simpan Data"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2.0 IMPORT VIA SCREENSHOT */}
      {activeTab === "screenshot_import" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {!detectedData ? (
            <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-4 text-[1.8rem]">📸</div>
              <h3 className="text-[1.1rem] font-black mb-1">Add by Screenshot</h3>
              <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-6 px-4">Upload Screenshot ShopeeFood untuk Auto-Fill data</p>
              
              <div 
                className={`relative border-2 border-dashed rounded-[2rem] p-10 transition-all ${ocrLoading ? 'border-blue-400 bg-blue-50/30' : 'border-neutral-200 hover:border-blue-400 hover:bg-neutral-50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleImageUpload(file);
                }}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                <div className="flex flex-col items-center">
                  {ocrLoading ? (
                    <>
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-[0.85rem] font-black text-blue-600">Membaca Gambar...</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <p className="text-[0.85rem] font-bold text-neutral-500">Ketuk atau seret gambar ke sini</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-[1rem] font-black">Data Terdeteksi</h3>
                  <button onClick={() => { setDetectedData(null); setPreviewImage(null); }} className="text-[0.7rem] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-xl">Ganti Gambar</button>
                </div>
                {previewImage && (
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 border border-neutral-100">
                    <img src={previewImage} className="w-full h-full object-contain bg-neutral-900" alt="Preview" />
                  </div>
                )}
                
                <form action={async (fd) => {
                  setLoading(true);
                  fd.append("lat", String(lat)); fd.append("lng", String(lng)); fd.append("area", area); fd.append("address", address);
                  const res = await upsertMerchant(fd);
                  setLoading(false);
                  if (res.success) {
                    const updated = await getAllMerchants();
                    setMerchants(updated);
                    setDetectedData(null); setPreviewImage(null);
                    alert("Merchant Berhasil Ditambahkan!");
                  } else alert(res.error);
                }} className="space-y-4">
                  <div>
                    <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1.5 ml-1">Nama Merchant</p>
                    <input name="name" defaultValue={detectedData.name} required className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-bold focus:bg-white transition-all outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1.5 ml-1">Kategori</p>
                      <select name="category" defaultValue={detectedData.category} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-bold outline-none">
                        <option value="Makanan">🍱 Makanan</option>
                        <option value="Minuman">🥤 Minuman</option>
                        <option value="Snack">🍿 Snack</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1.5 ml-1">Rating</p>
                      <input name="rating" type="number" step="0.1" defaultValue={detectedData.rating} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-bold outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1.5 ml-1">Promo (%)</p>
                      <input name="promo_percent" type="number" defaultValue={detectedData.promo} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-bold outline-none" />
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1.5 ml-1">ETA (Menit)</p>
                      <input name="eta_minutes" type="number" defaultValue={detectedData.eta} className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-bold outline-none" />
                    </div>
                  </div>

                  <div className="flex gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="free_shipping" defaultChecked={detectedData.freeDelivery} className="w-5 h-5 rounded-lg accent-blue-600" />
                      <span className="text-[0.8rem] font-bold text-neutral-600">Gratis Ongkir</span>
                    </label>
                  </div>

                  <hr className="border-neutral-100 my-2" />

                  <div className="flex flex-col gap-1.5">
                    <p className="text-[0.65rem] font-black text-neutral-400 uppercase tracking-widest mb-1 pl-1">Set Lokasi (Manual)</p>
                    <input 
                      type="text" 
                      placeholder="Link Gmaps / Koordinat (-6.xxx, 106.xxx)" 
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (!val.trim()) return;
                        if (val.includes("http")) {
                          const { resolveGmapsLink } = await import("@/app/admin/actions/signals");
                          const coords = await resolveGmapsLink(val);
                          if (coords.lat && coords.lng) { setLat(coords.lat); setLng(coords.lng); }
                        } else {
                          const coords = val.split(",");
                          if (coords.length >= 2) {
                            const newLat = parseFloat(coords[0].replace(/[^0-9.-]/g, ""));
                            const newLng = parseFloat(coords[1].replace(/[^0-9.-]/g, ""));
                            if (!isNaN(newLat) && !isNaN(newLng)) { setLat(newLat); setLng(newLng); }
                          }
                        }
                      }}
                      className="w-full px-5 py-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] focus:outline-none mb-2"
                    />
                    <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
                      setLat(newLat); setLng(newLng);
                      if (addr) setAddress(addr);
                      if (ar) setArea(ar);
                    }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input name="area" required value={area} onChange={e => setArea(e.target.value)} placeholder="Area (Wajib)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-bold" />
                    <input value={`${lat || ''}, ${lng || ''}`} readOnly placeholder="Koordinat" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] text-neutral-500 font-mono" />
                  </div>

                  <button disabled={loading} className="w-full mt-6 bg-neutral-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 text-[1.1rem]">
                    {loading ? "Menyimpan..." : "Konfirmasi & Simpan Resto"}
                  </button>
                </form>
              </div>
            </div>
          )}
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
              const { upsertSeller } = await import("@/app/admin/actions/signals");
              const res = await upsertSeller(fd);
              setLoading(false);
              if (res.success) { 
                const updated = await getAllMerchants(); 
                setMerchants(updated);
                alert("Saved!");
              } else alert(res.error);
            }} className="space-y-4">
              <input name="name" required placeholder="Nama Toko Seller / Ekspedisi" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold focus:border-neutral-900 focus:bg-white transition-all outline-none" />
              
              <div className="flex flex-col gap-1.5 mb-2">
                <input 
                  type="text" 
                  placeholder="Atau Paste Link Gmaps / Titik Koordinat (-6.xxx, 106.xxx)" 
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (!val.trim()) return;

                    if (val.includes("http") || val.includes("goo.gl") || val.includes("maps")) {
                      setLoading(true);
                      const { resolveGmapsLink } = await import("@/app/admin/actions/signals");
                      const coords = await resolveGmapsLink(val);
                      setLoading(false);
                      if (coords.lat && coords.lng) {
                        setLat(coords.lat);
                        setLng(coords.lng);
                      } else {
                        alert("Gagal mendeteksi koordinat dari link: " + (coords.error || ""));
                      }
                      return;
                    }

                    const coords = val.split(",");
                    if (coords.length >= 2) {
                      const newLat = parseFloat(coords[0].replace(/[^0-9.-]/g, ""));
                      const newLng = parseFloat(coords[1].replace(/[^0-9.-]/g, ""));
                      if (!isNaN(newLat) && !isNaN(newLng)) {
                        setLat(newLat);
                        setLng(newLng);
                      }
                    }
                  }}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] focus:outline-none"
                />
              </div>
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
                setLat(newLat); setLng(newLng);
                if (addr) setAddress(addr);
                if (ar) setArea(ar);
              }} />
              <div className="grid grid-cols-2 gap-3">
                <input name="area" required value={area} onChange={e => setArea(e.target.value)} placeholder="Kecamatan / Area (Wajib)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold" />
                <input value={`${lat || ''}, ${lng || ''}`} readOnly placeholder="Koordinat" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] text-neutral-500 font-mono focus:outline-none" />
              </div>

              {/* Seller-specific fields — no food delivery data */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                <p className="text-[0.7rem] font-black uppercase tracking-widest text-amber-700">📦 Data Seller / SPX</p>
                <select name="category" className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200 text-[0.9rem] font-semibold">
                  <option value="Paket">📦 SPX / Paket Ekspedisi</option>
                  <option value="Toko/Seller">🏪 Seller Online / Reseller</option>
                </select>
                <textarea name="notes" placeholder="Catatan (opsional) — misal: antri padat jam 16-18, dropoff cepat, dll" className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200 text-[0.85rem] resize-none" rows={2} />
              </div>

              <textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap (opsional)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />

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
                  <input name="open_time" type="time" lang="en-GB" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Tutup</p>
                  <input name="close_time" type="time" lang="en-GB" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold" />
                </div>
              </div>
              <input name="closed_days" placeholder="Hari Libur (opsional, misal: Senin, Minggu)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold mb-2" />

              <button disabled={loading} className="w-full mt-4 bg-amber-500 text-white font-black py-4 rounded-2xl shadow-[0_4px_14px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 tracking-wide text-[1.05rem]">
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
            
            <div className="flex flex-col gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Search name or area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-[0.85rem] font-semibold outline-none focus:border-neutral-900"
              />
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <select 
                  value={completenessFilter} 
                  onChange={(e) => setCompletenessFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-[0.75rem] font-bold outline-none shrink-0"
                >
                  <option value="all">All Completeness</option>
                  <option value="Complete">Complete</option>
                  <option value="Partial">Partial</option>
                  <option value="Basic">Basic</option>
                  <option value="missing_promo">Missing Promo</option>
                  <option value="missing_category">Missing Category</option>
                </select>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-[0.75rem] font-bold outline-none shrink-0"
                >
                  <option value="newest">By ID (Terbaru)</option>
                  <option value="priority">🔥 Hotspot Priority</option>
                </select>
              </div>
            </div>

            {merchants
              .filter(m => {
                if (filterLevel === "All") return true;
                if (filterLevel === "Resto") return m.category !== "Seller SPX" && m.category !== "Paket" && m.category !== "Toko/Seller";
                if (filterLevel === "Seller") return m.category === "Seller SPX" || m.category === "Paket" || m.category === "Toko/Seller";
                return true;
              })
              .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.area.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(m => {
                if (completenessFilter === "all") return true;
                const status = getCompleteness(m);
                if (completenessFilter === "missing_category") return !m.category;
                return status === completenessFilter;
              })
              .sort((a, b) => {
                if (sortBy === "priority" && hotspots?.length) {
                  const isAHotspot = hotspots.some(h => a.area?.toLowerCase().includes(h.name.toLowerCase()));
                  const isBHotspot = hotspots.some(h => b.area?.toLowerCase().includes(h.name.toLowerCase()));
                  if (isAHotspot && !isBHotspot) return -1;
                  if (!isAHotspot && isBHotspot) return 1;
                }
                if (a.short_id && b.short_id) {
                  return b.short_id.localeCompare(a.short_id);
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              })
              .map(m => {
                const compStatus = getCompleteness(m);
                const isHotspot = hotspots?.some(h => m.area?.toLowerCase().includes(h.name.toLowerCase()));
                return (
              <div key={m.id} className={`bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-3 ${!m.is_active ? "opacity-60 grayscale" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {m.short_id && <span className="text-[0.65rem] font-black bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">#{m.short_id}</span>}
                      <p className="font-black text-[1.05rem] tracking-tight">{m.name}</p>
                      {isHotspot && <span className="text-[0.6rem] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">HOTSPOT</span>}
                    </div>
                    <p className="text-[0.7rem] text-neutral-400 font-bold tracking-wide">{m.area} <span className="text-neutral-300 mx-0.5">•</span> {m.category || <span className="text-red-400">No Category</span>}</p>
                  </div>
                  <span className={`text-[0.6rem] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${compStatus === 'Complete' ? 'bg-emerald-100 text-emerald-700' : compStatus === 'Partial' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{compStatus}</span>
                </div>
                
                {!["Paket", "Toko/Seller", "Seller SPX"].includes(m.category) && (
                    <div className={`px-2.5 py-1.5 rounded-xl text-[0.65rem] font-black tracking-wide ${m.promo_active || m.promo_percent ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
                      💰 {m.promo_active || m.promo_percent ? "PROMO ACTIVE" : "NO PROMO"}
                    </div>
                )}

                <div className="flex gap-2 pt-2 mt-1">
                  <button 
                    onClick={() => setEditingMerchant(m)} 
                    className="flex-1 py-3 rounded-xl bg-neutral-900 text-[0.75rem] font-bold text-white active:scale-95 transition-all shadow-md"
                  >
                    Edit & Lengkapi Data
                  </button>
                  <a href={`/radar?lat=${m.lat}&lng=${m.lng}`} className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </a>
                </div>
              </div>
            )})}
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
              if (!lat || !lng) {
                alert("Silakan pilih lokasi di peta atau isi koordinat terlebih dahulu.");
                return;
              }
              setLoading(true);
              const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
              const res = await addManualSignal(
                lat,
                lng,
                String(fd.get("type") || "driver_ngetem"),
                Number(fd.get("count") || 1),
                expires_at
              );
              setLoading(false);
              if (res.error) alert(res.error);
              else {
                alert("Sinyal berhasil ditambahkan!");
                if (res.data) setSignals(prev => [res.data, ...prev]);
              }
            }} className="space-y-4">
              <div className="flex flex-col gap-1.5 mb-2">
                <input 
                  type="text" 
                  placeholder="Paste Link Gmaps / Titik Koordinat (-6.xxx, 106.xxx)" 
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (!val.trim()) return;
                    if (val.includes("http") || val.includes("goo.gl") || val.includes("maps")) {
                      setLoading(true);
                      const { resolveGmapsLink } = await import("@/app/admin/actions/signals");
                      const coords = await resolveGmapsLink(val);
                      setLoading(false);
                      if (coords.lat && coords.lng) { setLat(coords.lat); setLng(coords.lng); }
                      else alert("Gagal mendeteksi koordinat.");
                      return;
                    }
                    const coords = val.split(",");
                    if (coords.length >= 2) {
                      const newLat = parseFloat(coords[0].replace(/[^0-9.-]/g, ""));
                      const newLng = parseFloat(coords[1].replace(/[^0-9.-]/g, ""));
                      if (!isNaN(newLat) && !isNaN(newLng)) { setLat(newLat); setLng(newLng); }
                    }
                  }}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] focus:outline-none"
                />
              </div>
              <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng) => {
                setLat(newLat); setLng(newLng);
              }} />
              <input value={`${lat || ''}, ${lng || ''}`} readOnly placeholder="Koordinat" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] text-neutral-500 font-mono focus:outline-none" />
              
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
            
            <div className="flex flex-col gap-1.5 mb-2">
              <input 
                type="text" 
                placeholder="Paste Link Gmaps / Titik Koordinat (-6.xxx, 106.xxx)" 
                onChange={async (e) => {
                  const val = e.target.value;
                  if (!val.trim()) return;
                  if (val.includes("http") || val.includes("goo.gl") || val.includes("maps")) {
                    setLoading(true);
                    const { resolveGmapsLink } = await import("@/app/admin/actions/signals");
                    const coords = await resolveGmapsLink(val);
                    setLoading(false);
                    if (coords.lat && coords.lng) { setLat(coords.lat); setLng(coords.lng); }
                    else alert("Gagal mendeteksi koordinat.");
                    return;
                  }
                  const coords = val.split(",");
                  if (coords.length >= 2) {
                    const newLat = parseFloat(coords[0].replace(/[^0-9.-]/g, ""));
                    const newLng = parseFloat(coords[1].replace(/[^0-9.-]/g, ""));
                    if (!isNaN(newLat) && !isNaN(newLng)) { setLat(newLat); setLng(newLng); }
                  }
                }}
                className="w-full px-5 py-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] focus:outline-none"
              />
            </div>
            <LocationPicker initialLat={lat} initialLng={lng} onLocationSelect={(newLat, newLng, addr, ar) => {
              setLat(newLat); setLng(newLng);
              if (ar) setArea(ar);
            }} />
            <div className="grid grid-cols-2 gap-3">
              <input name="area" required value={area} onChange={e => setArea(e.target.value)} placeholder="Kecamatan / Area (Wajib)" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.95rem] font-semibold" />
              <input value={`${lat || ''}, ${lng || ''}`} readOnly placeholder="Koordinat" className="w-full px-5 py-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-[0.8rem] text-neutral-500 font-mono focus:outline-none" />
            </div>

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
                        ZPILOT: {u.ztips_id}
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

      {/* 6. FEEDBACK */}
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
            {merchants.filter(m => ["Makanan", "Minuman", "Snack"].includes(m.category)).map(m => (
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
              fd.append("area", editingMerchant.area);
              fd.append("address", editingMerchant.address || "");
              
              const isSeller = ["Paket", "Toko/Seller", "Seller SPX"].includes(editingMerchant.category);
              let res;
              if (isSeller) {
                const { upsertSeller } = await import("@/app/admin/actions/signals");
                res = await upsertSeller(fd);
              } else {
                const resMod = await upsertMerchant(fd);
                res = resMod;
              }
              
              setLoading(false);
              if (res.success) {
                const updated = await getAllMerchants();
                setMerchants(updated);
                setEditingMerchant(null);
              } else alert(res.error);
            }} className="space-y-3">
              {(() => {
                const isSeller = ["Paket", "Toko/Seller", "Seller SPX"].includes(editingMerchant.category);
                return (
                  <>
                    <input type="hidden" name="lat" value={editLat ?? ""} />
                    <input type="hidden" name="lng" value={editLng ?? ""} />
                    <div className="mb-3">
                      <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Lokasi Presisi</p>
                      <LocationPicker initialLat={editingMerchant.lat} initialLng={editingMerchant.lng} onLocationSelect={(newLat, newLng) => {
                        setEditLat(newLat);
                        setEditLng(newLng);
                      }} />
                    </div>
                    {isSeller ? (
                      <>
                        <input name="name" required defaultValue={editingMerchant.name} placeholder="Nama Toko Seller / Ekspedisi" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold outline-none" />
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3 mt-2 mb-2">
                          <p className="text-[0.7rem] font-black uppercase tracking-widest text-amber-700">📦 Data Seller / SPX</p>
                          <select name="category" defaultValue={editingMerchant.category} className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200 text-[0.9rem] font-semibold">
                            <option value="Paket">📦 SPX / Paket Ekspedisi</option>
                            <option value="Toko/Seller">🏪 Seller Online / Reseller</option>
                          </select>
                          <textarea name="notes" defaultValue={editingMerchant.notes || ""} placeholder="Catatan (opsional) — misal: antri padat jam 16-18, dropoff cepat, dll" className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200 text-[0.85rem] resize-none" rows={2} />
                        </div>
                      </>
                    ) : (
                      <>
                        <input name="name" required defaultValue={editingMerchant.name} placeholder="Nama Resto" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold outline-none" />
                        <select name="category" defaultValue={editingMerchant.category} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] font-semibold">
                          <option value="Makanan">🍱 Food</option>
                          <option value="Minuman">🥤 Drink</option>
                          <option value="Snack">🍟 Snack</option>
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                          <input name="rating" type="number" step="0.1" defaultValue={editingMerchant.rating ?? ""} placeholder="Rating (e.g. 4.5)" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                          <input name="reviews" type="number" defaultValue={editingMerchant.reviews ?? ""} placeholder="Review Count" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                        </div>
                        <div className="mt-1">
                          <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 pl-1">Promo Persen (%)</p>
                          <input name="promo_percent" type="number" defaultValue={editingMerchant.promo_percent ?? ""} placeholder="Contoh: 20" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
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
                  <input name="open_time" type="time" lang="en-GB" defaultValue={editingMerchant.open_time ?? ""} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Tutup</p>
                  <input name="close_time" type="time" lang="en-GB" defaultValue={editingMerchant.close_time ?? ""} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
                </div>
              </div>
              <input name="closed_days" defaultValue={editingMerchant.closed_days ?? ""} placeholder="Hari Libur (opsional, misal: Senin, Minggu)" className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingMerchant(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 font-bold text-neutral-600">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-neutral-900 font-bold text-white disabled:opacity-50">
                  {loading ? "..." : "Simpan"}
                </button>
              </div>
            </form>
            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
              <button 
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const { boostMerchantLive } = await import("@/app/admin/actions/signals");
                  const res = await boostMerchantLive(editingMerchant.id);
                  setLoading(false);
                  if (res.success) {
                    alert("Tandai ramai berhasil (+20 menit)!");
                  } else alert("Gagal tandai ramai");
                }} 
                className="flex-1 py-2.5 rounded-xl bg-purple-50 text-[0.7rem] font-bold text-purple-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 leading-tight"
              >
                <span>🔥</span>
                <span>Ramai</span>
              </button>
              <button type="button" onClick={async () => {
                await toggleMerchantActive(editingMerchant.id, !editingMerchant.is_active);
                setMerchants(prev => prev.map(x => x.id === editingMerchant.id ? { ...x, is_active: !editingMerchant.is_active } : x));
                setEditingMerchant(null);
              }} className={`flex-1 py-2.5 rounded-xl text-[0.7rem] font-bold uppercase tracking-widest transition-all ${editingMerchant.is_active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"} flex flex-col items-center justify-center gap-0.5 leading-tight`}>
                <span>{editingMerchant.is_active ? "🟢" : "⚪"}</span>
                <span>{editingMerchant.is_active ? t("enable") : t("disable")}</span>
              </button>
              <button type="button" onClick={async () => {
                if (confirm("Delete merchant?")) {
                  await deleteMerchant(editingMerchant.id);
                  setMerchants(prev => prev.filter(x => x.id !== editingMerchant.id));
                  setEditingMerchant(null);
                }
              }} className="flex-1 py-2.5 rounded-xl bg-red-50 text-[0.7rem] font-bold text-red-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 leading-tight">
                <span>🗑️</span>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EDIT SPOT MODAL */}
      {editingSpot && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[1.1rem] font-black">Edit Spot Mangkal</h3>
              <button onClick={() => setEditingSpot(null)} className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form action={async (fd) => {
              setLoading(true);
              const { updateNgetemSpot } = await import("./actions/notes");
              const res = await updateNgetemSpot(editingSpot.id, fd);
              setLoading(false);
              if (res.success) {
                const { getAllNgetemSpots } = await import("./actions/notes");
                const updated = await getAllNgetemSpots();
                setSpots(updated);
                setEditingSpot(null);
              } else alert(res.error);
            }} className="space-y-3">
              <input type="hidden" name="lat" value={editSpotLat ?? ""} />
              <input type="hidden" name="lng" value={editSpotLng ?? ""} />
              <div className="mb-3">
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Lokasi Presisi</p>
                <LocationPicker initialLat={editingSpot.lat} initialLng={editingSpot.lng} onLocationSelect={(newLat, newLng) => {
                  setEditSpotLat(newLat);
                  setEditSpotLng(newLng);
                }} />
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Nama Spot</p>
                <input name="name" required defaultValue={editingSpot.name} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Area</p>
                <input name="area" required defaultValue={editingSpot.area} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Kualitas</p>
                <select name="quality" defaultValue={editingSpot.quality} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]">
                  <option value="Bagus">Bagus</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Kurang">Kurang</option>
                </select>
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Jam Terbaik</p>
                <input name="best_hours" defaultValue={editingSpot.best_hours ?? ""} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem]" />
              </div>
              <div>
                <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1 pl-1">Catatan</p>
                <textarea name="notes" defaultValue={editingSpot.notes || ""} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] resize-none" rows={2} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingSpot(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 font-bold text-neutral-600">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-neutral-900 font-bold text-white disabled:opacity-50">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
