"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const nama = String(formData.get("nama") || "");
  const kota = String(formData.get("kota") || "");
  const driver_id = String(formData.get("driver_id") || "");
  const platform = String(formData.get("platform") || "");

  const { error } = await supabase
    .from("users")
    .update({ nama, kota, driver_id, platform })
    .eq("id", user.id);

  if (error) return { error: error.message };
  
  revalidatePath("/akun");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  
  if (password.length < 6) return { error: "Password minimal 6 karakter" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  
  return { success: true };
}

export async function sendFeedback(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Login diperlukan" };

  const message = String(formData.get("message") || "");
  if (!message) return { error: "Pesan tidak boleh kosong" };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    message
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Note: auth.deleteUser requires Service Role or Admin API.
  // For client-side, we usually trigger a request or use a service role action.
  // Here we use a simplified approach: mark as deleted or use service role if available.
  
  const { error: profileError } = await supabase.from("users").delete().eq("id", user.id);
  if (profileError) return { error: profileError.message };

  await supabase.auth.signOut();
  return { success: true };
}

export async function updateDriverStatus(status: string, lat?: number, lng?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updateData: any = { 
    status, 
    last_active: new Date().toISOString() 
  };
  
  if (lat && lng) {
    updateData.last_lat = lat;
    updateData.last_lng = lng;
  }

  await supabase.from("users").update(updateData).eq("id", user.id);
  
  if (lat && lng) {
    const { data: userData } = await supabase.from("users").select("nama").eq("id", user.id).single();
    await supabase.channel("zpilot-realtime").send({
      type: "broadcast",
      event: "driver-location",
      payload: {
        id: user.id,
        lat,
        lng,
        type: status === "Offline" ? "driver_offline" : (status === "Ngetem" ? "driver_ngetem" : "driver_antar"),
        label: userData?.nama || "Driver"
      }
    });
  }
  
  revalidatePath("/");
}
