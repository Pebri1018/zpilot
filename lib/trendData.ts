export type TimeSlot = "pagi" | "siang" | "sore" | "malam" | "tengah_malam";

export type TrendStatus = {
  id: TimeSlot;
  label: string;
  timeRange: string;
  intensity: "sepi" | "normal" | "ramai" | "super_ramai";
  description: string[];
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
      description: ["Fokus: Pesanan sarapan di area kos-kosan.", "Tambahan: Seller SPX/Paket mulai pick-up jam 09:00."],
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
      description: ["Puncak Kesibukan: Area kampus & kantoran sangat aktif.", "Fokus Utama: Makanan (Makan siang)."],
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
      description: ["Sangat Sepi: Waktu nanggung, orang istirahat/pulang.", "Saran: Mending istirahat & isi baterai HP."],
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
      description: ["Puncak Keramaian: Semua mencari makan malam.", "Persaingan: Sangat tinggi, tapi order melimpah."],
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
      description: ["Target: Mahasiswa begadang (Tugas kampus).", "Fokus Utama: Fast food & warkop/burjo 24 jam."],
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
    trends.siang.description = ["HARI SENIN SEPI: Mahasiswa & pekerja sibuk rutinitas awal.", "Saran: Hindari pusat keramaian, cari spot pinggiran."];
    trends.pagi.description = ["Warning: Traffic paket sangat padat.", "Catatan: Order makanan biasanya melambat."];
  }

  if (day === 6) { // Saturday
    trends.pagi.label = "Pagi (Sarapan & Wisata)";
    trends.pagi.intensity = "sepi";
    trends.pagi.description = ["SABTU PAGI: Toko/Seller SPX banyak libur.", "Fokus: 100% orderan makanan & sarapan wisata."];
    trends.pagi.recommendedZones = trends.pagi.recommendedZones.filter(z => z.target !== "paket");
    trends.malam.intensity = "super_ramai";
    trends.malam.description = ["MALAM MINGGU: Puncak keramaian kuliner mingguan.", "Warning: Hindari rute rawan macet parah!"];
    trends.malam.recommendedZones.push({ area: "Prawirotaman / Tirtodipuran", target: "makanan", reason: "Turis mencari cafe malam." });
  }

  if (day === 0) { // Sunday
    trends.pagi.label = "Pagi (Sarapan & Wisata)";
    trends.pagi.description = ["MINGGU PAGI: Gudang/Seller Paket TUTUP TOTAL.", "Fokus: 100% Gofood/ShopeeFood (Wisata & Kos)."];
    trends.pagi.recommendedZones = trends.pagi.recommendedZones.filter(z => z.target !== "paket");
    trends.sore.intensity = "ramai";
    trends.sore.description = ["MINGGU SORE: Orang mulai kembali ke kos/rumah.", "Peluang: Orderan makan malam masuk lebih awal."];
    trends.sore.recommendedZones = trends.sore.recommendedZones.filter(z => z.target !== "paket");
  }

  return trends;
}
