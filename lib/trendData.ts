export type TimeSlot = "pagi" | "siang" | "sore" | "malam" | "tengah_malam";

export type TrendStatus = {
  id: TimeSlot;
  label: string;
  timeRange: string;
  intensity: "sepi" | "normal" | "ramai" | "super_ramai";
  description: string;
  recommendedZones: {
    area: string;
    target: "makanan" | "paket" | "campur";
    reason: string;
  }[];
};

export function getCurrentTimeSlot(hour: number): TimeSlot {
  if (hour >= 6 && hour < 10) return "pagi";
  if (hour >= 10 && hour < 14) return "siang";
  if (hour >= 14 && hour < 17) return "sore";
  if (hour >= 17 && hour < 21) return "malam";
  return "tengah_malam"; // 21:00 - 05:59
}

export function getJogjaTrends(date: Date): Record<TimeSlot, TrendStatus> {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;
  const isMonday = day === 1;
  
  // Base configuration
  const trends: Record<TimeSlot, TrendStatus> = {
    pagi: {
      id: "pagi",
      label: "Pagi (Sarapan & Paket)",
      timeRange: "06:00 - 09:59",
      intensity: "ramai",
      description: "Pesanan sarapan di area kos, ditambah pesanan SPX/Paket dari seller mulai jam 09:00.",
      recommendedZones: [
        { area: "Seturan & Condongcatur", target: "makanan", reason: "Anak kos cari sarapan sebelum kelas." },
        { area: "Godean & Banguntapan", target: "paket", reason: "Gudang & seller mulai pick-up SPX." },
        { area: "Pusat Kota / Tugu", target: "makanan", reason: "Wisatawan sarapan di hotel/penginapan." }
      ]
    },
    siang: {
      id: "siang",
      label: "Siang (Makan Siang)",
      timeRange: "10:00 - 13:59",
      intensity: "super_ramai",
      description: "Jam paling sibuk untuk makanan. Anak kampus dan pekerja kantoran memesan makan siang.",
      recommendedZones: [
        { area: "UGM, UNY, UPN", target: "makanan", reason: "Pusat mahasiswa istirahat siang." },
        { area: "Malioboro & Sudirman", target: "makanan", reason: "Pusat pekerja kantoran." },
        { area: "UMY & Kasihan (Selatan)", target: "makanan", reason: "Area kampus selatan sangat aktif." }
      ]
    },
    sore: {
      id: "sore",
      label: "Sore (Waktu Nanggung)",
      timeRange: "14:00 - 16:59",
      intensity: "sepi",
      description: "Sangat sepi. Waktunya orang istirahat, di perjalanan pulang, atau kelas selesai. Mending isi baterai.",
      recommendedZones: [
        { area: "Jakal Bawah & Palagan", target: "campur", reason: "Ada sedikit orderan kopi/camilan sore." },
        { area: "Blok O & Janti", target: "paket", reason: "Sisa pick-up paket sore dari seller." }
      ]
    },
    malam: {
      id: "malam",
      label: "Malam (Makan Malam)",
      timeRange: "17:00 - 20:59",
      intensity: "super_ramai",
      description: "Puncak keramaian terbesar. Semua orang mencari makan malam. Persaingan tinggi tapi volume order luar biasa.",
      recommendedZones: [
        { area: "Gejayan, Seturan, Babarsari", target: "makanan", reason: "Pusat kuliner kos-kosan terpadat." },
        { area: "Alun-alun & Prawirotaman", target: "makanan", reason: "Pusat kuliner turis dan warga kota." },
        { area: "Jakal Atas (Kaliurang)", target: "makanan", reason: "Banyak resto keluarga dan cafe ramai." }
      ]
    },
    tengah_malam: {
      id: "tengah_malam",
      label: "Tengah Malam (Nugas)",
      timeRange: "21:00 - 05:59",
      intensity: "normal",
      description: "Khusus untuk mahasiswa yang begadang atau nugas mencari fast food & warkop 24 jam.",
      recommendedZones: [
        { area: "Seturan & Babarsari", target: "makanan", reason: "Pusat cafe 24 jam dan burjo." },
        { area: "Jakal Bawah", target: "makanan", reason: "Fast food dan McD/KFC sangat aktif." },
        { area: "Tamansiswa", target: "makanan", reason: "Kos-kosan pusat kota mencari camilan malam." }
      ]
    }
  };

  // Dynamic overrides based on day
  if (isMonday) {
    trends.siang.intensity = "sepi";
    trends.siang.description = "HARI SENIN SEPI: Pekerja kantoran dan mahasiswa baru mulai rutinitas, order makanan siang biasanya drop. Lebih baik cari spot pinggiran.";
    trends.pagi.description += " Hati-hati, hari Senin biasanya traffic paket sangat padat namun makanan lambat.";
  }

  if (day === 6) { // Saturday
    trends.pagi.intensity = "sepi";
    trends.pagi.description = "SABTU PAGI: Toko/Seller SPX banyak yang libur atau setengah hari. Fokus ke orderan makanan pagi/wisata.";
    trends.pagi.recommendedZones = trends.pagi.recommendedZones.filter(z => z.target !== "paket");
    trends.malam.intensity = "super_ramai";
    trends.malam.description = "MALAM MINGGU: Puncak keramaian kuliner mingguan. Jangan sampai terlewat! Hindari jalan macet (Malioboro).";
    trends.malam.recommendedZones.push({ area: "Prawirotaman / Tirtodipuran", target: "makanan", reason: "Turis dan expat mencari cafe malam." });
  }

  if (day === 0) { // Sunday
    trends.pagi.description = "MINGGU PAGI: Seller paket TUTUP TOTAL. Hindari spot gudang/toko. Fokus ke Gofood/ShopeeFood di area wisata dan kos.";
    trends.pagi.recommendedZones = trends.pagi.recommendedZones.filter(z => z.target !== "paket");
    trends.sore.intensity = "ramai";
    trends.sore.description = "MINGGU SORE: Orang mulai kembali ke kos/rumah dan memesan makan malam lebih awal.";
  }

  return trends;
}
