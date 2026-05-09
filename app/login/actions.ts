"use server";

import { createClient } from "@/lib/supabase/server";

export async function createUserProfile(userId: string, nama: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      nama: nama || "Driver",
      kota: "Yogyakarta",
      platform: "ShopeeFood",
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("createUserProfile error:", error.message, error.details, error.hint);
    return { error: error.message };
  }

  return { success: true };
}
