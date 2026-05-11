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

  const supabase = getServiceClient();

  // Step 1: fetch all feedback
  const { data: feedbackRows, error } = await supabase
    .from("feedback")
    .select("id, message, status, created_at, user_id, admin_reply")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getFeedbackList error:", error.message);
    return [];
  }
  if (!feedbackRows || feedbackRows.length === 0) return [];

  // Step 2: fetch user info for all unique user_ids
  const userIds = [...new Set(feedbackRows.map((f: any) => f.user_id).filter(Boolean))];
  const { data: userRows } = await supabase
    .from("users")
    .select("id, nama, email")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const userMap = Object.fromEntries((userRows || []).map((u: any) => [u.id, u]));

  // Step 3: merge
  return feedbackRows.map((f: any) => ({
    ...f,
    users: userMap[f.user_id] || null,
  }));
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

export async function replyFeedback(feedbackId: string, message: string, status: string = 'replied') {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from("feedback")
      .update({ 
        admin_reply: message, 
        status, 
        replied_at: new Date().toISOString() 
      })
      .eq("id", feedbackId);

    if (error) {
      console.error("replyFeedback primary error:", error.message);
      // Fallback: try with 'reviewed' status if 'replied' is the one failing constraint
      const { error: retryError } = await supabase
        .from("feedback")
        .update({ 
          admin_reply: message, 
          status: 'reviewed', 
          replied_at: new Date().toISOString() 
        })
        .eq("id", feedbackId);
        
      if (retryError) return { error: retryError.message };
    }
    
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Unknown error" };
  }
}
