"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ID" | "EN";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ID: {
    // Navigation
    home: "Beranda",
    radar: "Radar",
    tren: "Tren",
    account: "Akun",
    admin: "Admin",
    // Statuses
    ngetem: "Ngetem",
    antar: "Antar",
    offline: "Offline",
    // Home Page
    halo: "Halo",
    current_loc: "Lokasi Saat Ini",
    searching_loc: "Mencari lokasi...",
    zone_status: "Status Zona",
    order_potential: "Orderan",
    rivals: "Pesaing",
    wait_timer: "Timer Ngetem",
    active_merchants: "Resto & Promo Aktif",
    ai_pilot_suggest: "Saran ZPilot AI",
    open_radar: "Buka ZPilot Radar",
    refresh: "Perbarui",
    // Account Page
    logout: "Keluar Akun",
    delete_account: "Hapus Akun",
    settings: "Pengaturan",
    language: "Bahasa",
    notifications: "Notifikasi",
    battery_saver: "Hemat Baterai",
    edit_profile: "Edit Profil",
    change_password: "Ubah Password",
    hubungi_admin: "Hubungi Admin",
    kirim_masukan: "Kirim Masukan",
    save: "Simpan",
    cancel: "Batal",
    update: "Update",
    // Radar
    navigate: "Navigasi",
    legend: "Keterangan Radar",
    // Admin
    manage_merchants: "Kelola Merchant",
    quick_mode: "Mode Gercep",
    detail_mode: "Mode Detail",
    save_merchant: "Simpan Merchant",
    merchant_name: "Nama Resto",
    rating: "Rating",
    reviews: "Jumlah Review",
    promo: "Promo",
    fast_pickup: "Pickup Cepat",
    address: "Alamat",
    category: "Kategori",
    notes: "Catatan",
    delete: "Hapus",
    edit: "Edit",
    disable: "Nonaktifkan",
    enable: "Aktifkan"
  },
  EN: {
    // Navigation
    home: "Home",
    radar: "Radar",
    tren: "Trend",
    account: "Account",
    admin: "Admin",
    // Statuses
    ngetem: "Waiting",
    antar: "Delivering",
    offline: "Offline",
    // Home Page
    halo: "Hello",
    current_loc: "Current Location",
    searching_loc: "Locating...",
    zone_status: "Zone Status",
    order_potential: "Orders",
    rivals: "Rivals",
    wait_timer: "Waiting Timer",
    active_merchants: "Active Merchants",
    ai_pilot_suggest: "ZPilot AI Suggestion",
    open_radar: "Open ZPilot Radar",
    refresh: "Refresh",
    // Account Page
    logout: "Log Out",
    delete_account: "Delete Account",
    settings: "Settings",
    language: "Language",
    notifications: "Notifications",
    battery_saver: "Battery Saver",
    edit_profile: "Edit Profile",
    change_password: "Change Password",
    hubungi_admin: "Contact Admin",
    kirim_masukan: "Send Feedback",
    save: "Save",
    cancel: "Cancel",
    update: "Update",
    // Radar
    navigate: "Navigate",
    legend: "Radar Legend",
    // Admin
    manage_merchants: "Manage Merchants",
    quick_mode: "Quick Mode",
    detail_mode: "Detail Mode",
    save_merchant: "Save Merchant",
    merchant_name: "Merchant Name",
    rating: "Rating",
    reviews: "Reviews Count",
    promo: "Promo",
    fast_pickup: "Fast Pickup",
    address: "Address",
    category: "Category",
    notes: "Notes",
    delete: "Delete",
    edit: "Edit",
    disable: "Disable",
    enable: "Enable"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ID");

  useEffect(() => {
    const saved = localStorage.getItem("ztips_lang") as Language;
    if (saved && (saved === "ID" || saved === "EN")) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("ztips_lang", newLang);
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
