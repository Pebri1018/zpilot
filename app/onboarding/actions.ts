"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type OnboardingState = {
  error?: string;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nama = String(formData.get("nama") ?? "").trim();
  const kota = String(formData.get("kota") ?? "").trim();
  const platform = String(formData.get("platform") ?? "ShopeeFood").trim() || "ShopeeFood";
  const driverIdRaw = String(formData.get("driver_id") ?? "").trim();
  const driverId = driverIdRaw.length > 0 ? driverIdRaw : null;

  if (!nama || !kota) {
    return { error: "Nama panggilan dan kota wajib diisi." };
  }

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      nama,
      kota,
      platform,
      driver_id: driverId,
      onboarding_completed: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("Supabase Error detail:", error);
    return { error: `Gagal menyimpan: ${error.message}` };
  }

  redirect("/");
}
