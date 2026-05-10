"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "../actions";

export async function getFeedbackList() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("feedback")
    .select("*, users(nama, email)")
    .order("created_at", { ascending: false });

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
