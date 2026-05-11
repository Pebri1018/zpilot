"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { verifyAdmin } from "../actions";
import { revalidatePath } from "next/cache";

function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getFeedbackList() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];

  // Use service role to bypass RLS — admin needs to see all feedback
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("id, message, status, created_at, user_id, users(nama, email)")
    .order("created_at", { ascending: false });

  if (error) console.error("getFeedbackList error:", error.message);
  return data || [];
}

export async function getUserList() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("last_active", { ascending: false });

  return data || [];
}

export async function getAdminStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { users: 0, feedback: 0, signals: 0 };

  const supabase = await createClient();
  const [u, f, s] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("merchant_signals").select("id", { count: "exact" }).eq("is_active", true)
  ]);

  return {
    users: u.count || 0,
    feedback: f.count || 0,
    signals: s.count || 0
  };
}

export async function toggleUserDisabled(userId: string, is_disabled: boolean) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_disabled })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUserAccount(userId: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = getServiceClient();
  
  // 1. Delete from public.users (cascade might handle others)
  const { error: profileError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  // 2. Delete from auth.users (requires service role)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  
  if (authError) return { error: authError.message };

  revalidatePath("/admin");
  return { success: true };
}
