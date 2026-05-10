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
    home: "Beranda",
    radar: "Radar",
    account: "Akun",
    admin: "Admin",
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
    active: "Aktif",
    offline: "Offline",
    loading: "Memuat...",
    session_expired: "Sesi berakhir, silakan login kembali.",
    back: "Kembali",
    save: "Simpan",
    cancel: "Batal",
    update: "Update",
    // Add more as needed
  },
  EN: {
    home: "Home",
    radar: "Radar",
    account: "Account",
    admin: "Admin",
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
    active: "Active",
    offline: "Offline",
    loading: "Loading...",
    session_expired: "Session expired, please login again.",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    update: "Update",
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
