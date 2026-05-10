"use server";

import { createClient as createServerClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";

export async function createUserProfile(userId: string, data: { nama: string; kota: string; driverId: string; platform: string }) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase URL or Service Role Key");
    return { error: "Konfigurasi server tidak lengkap." };
  }

  // Use service role client — bypasses RLS and FK restrictions
  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      nama: data.nama || "Driver",
      kota: data.kota || "Yogyakarta",
      driver_id: data.driverId || null,
      platform: data.platform || "Lainnya",
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("createUserProfile error:", error.message, error.details);
    return { error: error.message };
  }

  return { success: true };
}
