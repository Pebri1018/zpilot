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
    notes
  });

  if (error) {
    console.error("Error inserting manual density", error);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function reportMerchantSignal(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return;

  const name = String(formData.get("name"));
  const category = String(formData.get("category") || "");
  const busy_level = String(formData.get("busy_level"));
  const promo_active = formData.get("promo_active") === "on";
  const fast_pickup = formData.get("fast_pickup") === "on";
  
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const area = String(formData.get("area") || "Area tidak diketahui");

  if (!name || !busy_level) return;

  const supabase = getServiceClient();
  const { error } = await supabase.from("merchant_signals").insert({
    name,
    category,
    busy_level,
    promo_active,
    fast_pickup,
    lat: isNaN(lat) ? null : lat,
    lng: isNaN(lng) ? null : lng,
    area
  });

  if (error) {
    console.error("Error inserting merchant signal", error);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export type MerchantSignal = {
  id: string;
  name: string;
  category: string;
  busy_level: 'Low' | 'Medium' | 'High';
  promo_active: boolean;
  fast_pickup: boolean;
  area: string;
  created_at: string;
};

export async function getActiveMerchants(areaName: string | null): Promise<MerchantSignal[]> {
  if (!areaName) return [];

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // Get active signals in the current area
  const { data } = await supabase
    .from("merchant_signals")
    .select("*")
    .eq("area", areaName)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  return data || [];
}
