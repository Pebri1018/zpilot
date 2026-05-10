"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function updateProfile(formData: FormData) {
  const supabase = await getServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const nama = String(formData.get("nama") || "").trim();
  const kota = String(formData.get("kota") || "").trim();
  const driver_id = String(formData.get("driver_id") || "").trim();
  const platform = String(formData.get("platform") || "ShopeeFood");

  if (!nama || !kota) {
    return { error: "Nama dan kota wajib diisi" };
  }

  const { error } = await supabase
    .from("users")
    .update({ nama, kota, driver_id, platform })
    .eq("id", user.id);

  if (error) {
    console.error("Update profile error:", error);
    return { error: "Gagal update profil" };
  }

  revalidatePath("/akun");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const supabase = await getServiceClient();

  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Semua field password wajib diisi" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Password baru tidak cocok" };
  }

  if (newPassword.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  // Verify current password by attempting sign in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Password saat ini salah" };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Change password error:", updateError);
    return { error: "Gagal ubah password" };
  }

  return { success: true };
}

export async function sendFeedback(formData: FormData) {
  const supabase = await getServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const message = String(formData.get("message") || "").trim();

  if (!message) {
    return { error: "Pesan feedback wajib diisi" };
  }

  const { error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      message,
      status: "pending",
    });

  if (error) {
    console.error("Send feedback error:", error);
    return { error: "Gagal kirim feedback" };
  }

  return { success: true };
}

export async function deleteAccount() {
  const supabase = await getServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Delete user data first
  const { error: deleteDataError } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  if (deleteDataError) {
    console.error("Delete user data error:", deleteDataError);
    return { error: "Gagal hapus data akun" };
  }

  // Delete auth user
  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteAuthError) {
    console.error("Delete auth user error:", deleteAuthError);
    return { error: "Gagal hapus akun" };
  }

  redirect("/login");
}</content>
<parameter name="filePath">c:\Project\ztips\app\akun\actions.ts