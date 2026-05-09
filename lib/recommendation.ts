export type RecommendationResult = {
  action: "STAY" | "MOVE";
  title: string;
  reason: string;
  targetZone?: string;
  color: string;
};

export function getRecommendation(area: string | null, hour: number): RecommendationResult {
  const currentArea = area?.toLowerCase() || "";

  // 11:00 - 13:00 (Lunch time)
  if (hour >= 11 && hour <= 13) {
    if (currentArea.includes("kampus") || currentArea.includes("ugm") || currentArea.includes("uny") || currentArea.includes("upn")) {
      return {
        action: "STAY",
        title: "TETAP DI SINI",
        reason: "Waktu makan siang, orderan area kampus biasanya tinggi.",
        color: "#00AA13" // Green
      };
    }
  }

  // 14:00 - 16:00 (Afternoon slump)
  if (hour >= 14 && hour <= 16) {
    if (currentArea.includes("seturan")) {
      return {
        action: "MOVE",
        title: "GESER KE KAMPUS",
        reason: "Sore hari Seturan agak sepi, geser ke area kampus untuk orderan snack.",
        targetZone: "Area UGM / UNY",
        color: "#F5A623" // Orange
      };
    }
  }

  // 18:00 - 20:00 (Dinner time)
  if (hour >= 18 && hour <= 20) {
    if (currentArea.includes("babarsari") || currentArea.includes("seturan")) {
      return {
        action: "STAY",
        title: "TETAP DI SINI",
        reason: "Waktu makan malam, area ini sedang ramai-ramainya.",
        color: "#00AA13"
      };
    }
  }

  // Generic fallbacks based on time
  if (hour >= 6 && hour <= 10) {
    return {
      action: "MOVE",
      title: "CARI AREA KANTOR",
      reason: "Pagi hari cocok cari orderan sarapan dekat perkantoran.",
      color: "#F5A623"
    };
  }

  if (hour >= 21) {
    return {
      action: "STAY",
      title: "STANDBY BENTAR",
      reason: "Orderan malam biasanya stabil di area padat.",
      color: "#00AA13"
    };
  }

  // Default
  return {
    action: "STAY",
    title: "TETAP DI SINI",
    reason: "Menunggu data orderan terkumpul...",
    color: "#00AA13"
  };
}
