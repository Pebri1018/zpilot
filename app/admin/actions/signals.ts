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
  const promo_active = formData.get("promo_active") === "on";
  const promo_percent = formData.get("promo_percent") ? Number(formData.get("promo_percent")) : 0;
  const pickup_fast = formData.get("pickup_fast") === "on";
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

  if (!name || !area) return { error: "Nama resto dan area wajib diisi" };

  // --- AUTO SCORE LOGIC ---
  // Score 0-100 base
  let score = 0;
  score += rating * 10; // Max 50
  score += Math.min(20, (reviews / 50) * 10); // Max 20 (cap at 100 reviews)
  if (promo_active) {
    score += 10;
    if (promo_percent > 0) {
      score += Math.min(15, promo_percent / 4); // Up to 15 bonus points for big promos
    }
  }
  if (pickup_fast) score += 15;
  if (free_shipping) score += 10; // Bonus score for free shipping

  // Map to 1-5 busy_score for backward compat and Low/Med/High label
  const busy_score = Math.max(1, Math.min(5, Math.floor(score / 20)));
  const busy_level = busy_score >= 4 ? "High" : busy_score >= 2 ? "Medium" : "Low";

  const supabase = getServiceClient();
  const { error } = await supabase.from("merchant_signals").upsert(
    {
      name,
      category,
      busy_score,
      busy_level,
      promo_active,
      promo_percent,
      pickup_fast,
      fast_pickup: pickup_fast,
      free_shipping,
      is_active: true,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
      area,
      address,
      rating,
      reviews,
      open_time,
      close_time,
      popularity_score: score,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "name,area" }
  );

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/radar");
  return { success: true };
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
  name: string;
  category: string;
  busy_level: "Low" | "Medium" | "High";
  busy_score?: number | null;
  popularity_score?: number | null;
  promo_active: boolean;
  promo_percent?: number | null;
  fast_pickup: boolean;
  pickup_fast?: boolean;
  is_active?: boolean;
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
};

// Primary query for Home page — persistent active merchants sorted by busy_score
export async function getActiveMerchants(areaName: string | null): Promise<MerchantSignal[]> {
  if (!areaName) return [];

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("merchant_signals")
    .select("*")
    .eq("area", areaName)
    .eq("is_active", true)
    .order("busy_score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(15);

  if (error) {
    console.error("getActiveMerchants error:", error);
    // Fallback: try without is_active filter (in case migration not run yet)
    const { data: fallback } = await supabase
      .from("merchant_signals")
      .select("*")
      .eq("area", areaName)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(15);
    return fallback || [];
  }

  return data || [];
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
