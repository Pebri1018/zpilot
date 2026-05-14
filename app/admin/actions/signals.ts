"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { verifyAdmin } from "@/app/admin/actions";
import { revalidatePath } from "next/cache";

function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function reportManualDensity(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return;

  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const area = String(formData.get("area") || "Area tidak diketahui");
  const driver_count = Number(formData.get("driver_count"));
  const radius = Number(formData.get("radius") || 50);
  const notes = String(formData.get("notes") || "");

  if (!area || isNaN(driver_count)) return;

  const supabase = getServiceClient();
  const { error } = await supabase.from("manual_density_reports").insert({
    lat: isNaN(lat) ? null : lat,
    lng: isNaN(lng) ? null : lng,
    area,
    driver_count,
    radius,
    notes,
  });

  if (error) {
    console.error("Error inserting manual density", error);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

// Persistent merchant upsert — admins add restaurants permanently
export async function upsertMerchant(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Makanan");
  const promo_percent = formData.get("promo_percent") ? Number(formData.get("promo_percent")) : 0;
  const promo_active = promo_percent > 0;
  const latStr = String(formData.get("lat"));
  const lngStr = String(formData.get("lng"));
  const lat = latStr && latStr !== "null" ? Number(latStr) : null;
  const lng = lngStr && lngStr !== "null" ? Number(lngStr) : null;
  const area = String(formData.get("area") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const rating = formData.get("rating") ? Number(formData.get("rating")) : 0;
  const reviews = formData.get("reviews") ? Number(formData.get("reviews")) : 0;
  const open_time = String(formData.get("open_time") || "").trim() || null;
  const close_time = String(formData.get("close_time") || "").trim() || null;
  const free_shipping = formData.get("free_shipping") === "on";
  const is_open_24h = formData.get("is_open_24h") === "on";
  const closed_days = String(formData.get("closed_days") || "").trim() || null;
  const volume = String(formData.get("volume") || "Normal");
  const platform = String(formData.get("platform") || "ZPILOT");
  const external_id = String(formData.get("external_id") || "").trim() || null;
  const priority = Number(formData.get("priority") || 0);

  if (!name || !area) return { error: "Nama resto dan area wajib diisi" };

  // --- AUTO SCORE LOGIC (Strict) ---
  // Score 0-100 base
  let score = 0;
  score += rating * 10;                                   // Max 50 (5 * 10)
  score += Math.min(15, (reviews / 100) * 15);            // Max 15 (capped at 100 reviews)
  if (promo_active) {
    score += 15;
    if (promo_percent >= 30) score += 10;                  // Big promo bonus
    else if (promo_percent > 0) score += 5;
  }
  if (free_shipping) score += 8;

  // Strict mapping: High requires really good score (>= 60), Med requires >= 35
  const busy_score = score >= 60 ? 5 : score >= 35 ? 3 : 1;
  const busy_level = busy_score >= 5 ? "High" : busy_score >= 3 ? "Medium" : "Low";

  let live_score = undefined;
  let live_status = undefined;
  let manual_admin_boost_until = undefined;

  if (volume === "Ramai") {
    live_score = 100;
    live_status = "Sangat Sibuk";
    manual_admin_boost_until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  } else if (volume === "Sepi") {
    live_score = 10;
    live_status = "Sepi";
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.from("merchant_signals").upsert(
    {
      name,
      category,
      busy_score,
      busy_level,
      promo_active,
      promo_percent,
      free_shipping,
      is_active: true,
      is_open_24h: is_open_24h || false,
      open_time: is_open_24h ? null : open_time,
      close_time: is_open_24h ? null : close_time,
      closed_days,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
      area,
      address,
      rating,
      reviews,
      popularity_score: score,
      live_score,
      live_status,
      manual_admin_boost_until,
      platform,
      external_id,
      priority,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "name,area" }
  ).select().single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/radar");
  return { success: true, data };
}

// Seller / SPX upsert — simplified, no food-delivery fields
export async function upsertSeller(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Paket");
  const latStr = String(formData.get("lat"));
  const lngStr = String(formData.get("lng"));
  const lat = latStr && latStr !== "null" ? Number(latStr) : null;
  const lng = lngStr && lngStr !== "null" ? Number(lngStr) : null;
  const area = String(formData.get("area") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const open_time = String(formData.get("open_time") || "").trim() || null;
  const close_time = String(formData.get("close_time") || "").trim() || null;
  const is_open_24h = formData.get("is_open_24h") === "on";
  const closed_days = String(formData.get("closed_days") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const volume = String(formData.get("volume") || "Normal");

  if (!name || !area) return { error: "Nama dan area wajib diisi" };

  const busy_score = volume === "Ramai" ? 5 : volume === "Normal" ? 3 : 1;
  const busy_level = busy_score >= 5 ? "High" : busy_score >= 3 ? "Medium" : "Low";

  const supabase = getServiceClient();
  const { data, error } = await supabase.from("merchant_signals").upsert(
    {
      name,
      category,
      busy_score,
      busy_level,
      promo_active: false,
      promo_percent: null,
      pickup_fast: false,
      fast_pickup: false,
      free_shipping: false,
      is_active: true,
      is_open_24h: is_open_24h || false,
      open_time: is_open_24h ? null : open_time,
      close_time: is_open_24h ? null : close_time,
      closed_days,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
      area,
      address,
      rating: null,
      reviews: null,
      notes,
      popularity_score: busy_score * 20,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "name,area" }
  ).select().single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/radar");
  return { success: true, data };
}

export async function deleteMerchant(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = getServiceClient();
  const { error } = await supabase.from("merchant_signals").delete().eq("id", id);
  
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/radar");
  return { success: true };
}

export async function toggleMerchantActive(id: string, is_active: boolean) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return;

  const supabase = getServiceClient();
  await supabase
    .from("merchant_signals")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/");
}

// Keep old function name for backward compat (Admin Advanced Mode)
export async function reportMerchantSignal(formData: FormData) {
  return upsertMerchant(formData);
}

export type MerchantSignal = {
  id: string;
  short_id?: string | null;
  name: string;
  category: string;
  busy_level: "Low" | "Medium" | "High"; // legacy
  busy_score?: number | null; // legacy
  live_score?: number;
  live_status?: "Sepi" | "Bergerak" | "Mulai Panas" | "Ramai Pickup" | "Sangat Sibuk";
  driver_antar_nearby?: number;
  driver_ngetem_nearby?: number;
  manual_admin_boost_until?: string | null;
  promo_active: boolean;
  promo_percent?: number | null;
  fast_pickup: boolean;
  pickup_fast?: boolean;
  is_active?: boolean;
  is_flash_sale?: boolean;
  is_open_24h?: boolean;
  area: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  reviews?: number | null;
  eta_minutes?: number | null;
  distance_km?: number | null;
  discount_text?: string | null;
  free_shipping?: boolean | null;
  notes?: string | null;
  updated_at?: string;
  created_at: string;
  open_time?: string | null;
  close_time?: string | null;
  closed_days?: string | null;
  platform?: string | null;
  external_id?: string | null;
  priority?: number | null;
};

// Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

// Primary query for Home page — live intelligence based on driver movement
export async function getActiveMerchants(areaName: string | null): Promise<MerchantSignal[]> {
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // 1. Fetch active merchants (exclude SPX sellers)
  const query = supabase
    .from("merchant_signals")
    .select("*")
    .eq("is_active", true)
    .neq("category", "Seller SPX")
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  const { data: merchantsData, error } = await query;
  if (error) {
    console.error("getActiveMerchants error:", error);
    return [];
  }

  let result = merchantsData || [];

  // Filter out closed merchants
  const jakartaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const jakartaTimeObj = new Date(jakartaTimeStr);
  const hour = jakartaTimeObj.getHours();
  const jakartaTime = jakartaTimeObj.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
  
  result = result.filter(m => {
    if (m.is_open_24h) return true;
    if (m.open_time && m.close_time) {
      const isOvernight = m.open_time > m.close_time;
      return isOvernight
        ? (jakartaTime >= m.open_time || jakartaTime < m.close_time)
        : (jakartaTime >= m.open_time && jakartaTime < m.close_time);
    }
    return true; 
  });

  // 2. Fetch recent drivers (last 15 mins)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: drivers } = await supabase
    .from("users")
    .select("last_lat, last_lng, status")
    .not("last_lat", "is", null)
    .neq("status", "Offline")
    .gte("last_active", fifteenMinsAgo);

  const activeDrivers = drivers || [];

  // 3. Historical hour bonus (Lunch 11-13, Dinner 17-19, Night 20-23)
  const isPeak = (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19) || (hour >= 20 && hour <= 23);
  const historical_hour_bonus = isPeak ? 1 : 0;

  // 4. Calculate Live Score for each merchant
  result = result.map(m => {
    let antar_15m = 0;
    let ngetem_15m = 0;

    if (m.lat && m.lng) {
      activeDrivers.forEach(d => {
        if (!d.last_lat || !d.last_lng) return;
        const dist = getDistance(m.lat!, m.lng!, d.last_lat, d.last_lng);
        if (dist <= 0.12) { // 120m radius
          if (d.status === 'Antar') antar_15m++;
          if (d.status === 'Ngetem') ngetem_15m++;
        }
      });
    }

    const promoScore = m.promo_active ? 1 : 0;
    const fastScore = m.fast_pickup ? 1 : 0;
    
    let adminBoost = 0;
    if (m.manual_admin_boost_until && m.manual_admin_boost_until > now) {
      adminBoost = 1;
    }

    const live_score = 
      (antar_15m * 5) + 
      (ngetem_15m * 2) + 
      (promoScore * 15) + 
      (fastScore * 10) + 
      (historical_hour_bonus * 10) + 
      (adminBoost * 20);

    let live_status: "Sepi" | "Bergerak" | "Mulai Panas" | "Ramai Pickup" | "Sangat Sibuk" = "Sepi";
    if (live_score >= 90) live_status = "Sangat Sibuk";
    else if (live_score >= 66) live_status = "Ramai Pickup";
    else if (live_score >= 41) live_status = "Mulai Panas";
    else if (live_score >= 20) live_status = "Bergerak";

    return {
      ...m,
      live_score,
      live_status,
      driver_antar_nearby: antar_15m,
      driver_ngetem_nearby: ngetem_15m
    };
  });

  // 5. Sort by live_score
  if (areaName) {
    result.sort((a, b) => {
      const aLocal = a.area?.toLowerCase().includes(areaName.toLowerCase()) ? 1 : 0;
      const bLocal = b.area?.toLowerCase().includes(areaName.toLowerCase()) ? 1 : 0;
      if (bLocal !== aLocal) return bLocal - aLocal;
      return (b.live_score || 0) - (a.live_score || 0);
    });
  } else {
    result.sort((a, b) => (b.live_score || 0) - (a.live_score || 0));
  }

  return result;
}

// For Admin listing — all merchants regardless of area
export async function getAllMerchants(): Promise<MerchantSignal[]> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];

  const supabase = getServiceClient();
  const { data } = await supabase
    .from("merchant_signals")
    .select("*")
    .order("area", { ascending: true })
    .order("busy_score", { ascending: false })
    .limit(100);

  return data || [];
}

export async function toggleFlashSale(id: string, isFlashSale: boolean) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = getServiceClient();
  
  // Flash sale = informational tag only. Do NOT change busy_score.
  const { error } = await supabase.from("merchant_signals").update({
    is_flash_sale: isFlashSale,
  }).eq("id", id);

  if (error) {
    console.error("Error toggling flash sale", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/radar");
  return { success: true };
}

export async function boostMerchantLive(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = getServiceClient();
  const until = new Date(Date.now() + 20 * 60000).toISOString();
  
  const { error } = await supabase.from("merchant_signals").update({
    manual_admin_boost_until: until
  }).eq("id", id);
  
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/radar");
  revalidatePath("/");
  return { success: true };
}

export async function resolveGmapsLink(url: string) {
  try {
    let finalUrl = url;
    
    // Un-shorten if maps.app.goo.gl or bit.ly or similar short link
    if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
      const res = await fetch(url, { redirect: "manual" });
      const location = res.headers.get("location");
      if (location) finalUrl = location;
    }

    // Match /@lat,lng
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Match !3dLAT!4dLNG
    const dataMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dataMatch) {
      return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };
    }
    
    // Match q=lat,lng
    const qMatch = finalUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    return { error: "No coordinates found in link" };
  } catch (e) {
    return { error: String(e) };
  }
}
