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
  const busy_score = Math.min(5, Math.max(1, Number(formData.get("busy_score") || 3)));
  const promo_active = formData.get("promo_active") === "on";
  const pickup_fast = formData.get("pickup_fast") === "on";
  const rating = formData.get("rating") ? Number(formData.get("rating")) : null;
  const review_count = formData.get("review_count") ? Number(formData.get("review_count")) : null;
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;

  const area_override = String(formData.get("area_override") || "").trim();
  const area_gps = String(formData.get("area") || "").trim();
  const area = area_override || area_gps;

  if (!name || !area) return { error: "Nama restoran dan area wajib diisi" };

  // Calculate popularity score: rating * log(review_count + 1) * busy_score
  let popularity_score = busy_score; // default
  if (rating && review_count) {
    popularity_score = rating * Math.log(review_count + 1) * (busy_score / 3);
  }

  // Map busy_score to busy_level for backward compat
  const busy_level = busy_score >= 4 ? "High" : busy_score >= 2 ? "Medium" : "Low";

  const supabase = getServiceClient();
  const { error } = await supabase.from("merchant_signals").upsert(
    {
      name,
      category,
      busy_score,
      busy_level,
      promo_active,
      fast_pickup: pickup_fast,
      pickup_fast,
      is_active: true,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
      area,
      rating: rating && !isNaN(rating) ? rating : null,
      reviews: review_count && !isNaN(review_count) ? review_count : null,
      popularity_score,
      updated_at: new Date().toISOString(),
      // Set expires far in the future so persistent merchants always appear
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    { onConflict: "name,area" }
  );

  if (error) {
    console.error("Error upserting merchant:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
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
  promo_active: boolean;
  fast_pickup: boolean;
  pickup_fast?: boolean;
  is_active?: boolean;
  area: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  reviews?: number | null;
  popularity_score?: number | null;
  eta_minutes?: number | null;
  distance_km?: number | null;
  discount_text?: string | null;
  free_shipping?: boolean | null;
  notes?: string | null;
  updated_at?: string;
  created_at: string;
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
