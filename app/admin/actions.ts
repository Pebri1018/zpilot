"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { revalidatePath } from "next/cache";

export type BroadcastType = "spot_ramai" | "hindari_area" | "promo_seller" | "paket_spx" | "cuaca_event";

export type Broadcast = {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  active: boolean;
  created_at: string;
};

function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!user && !!adminEmail && user.email === adminEmail;
}

export async function getBroadcasts(): Promise<Broadcast[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getLatestActiveBroadcast(): Promise<Broadcast | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function createBroadcast(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Akses ditolak." };

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const type = String(formData.get("type") ?? "") as BroadcastType;

  if (!title || !message || !type) return { error: "Semua field wajib diisi." };

  const supabase = getServiceClient();
  const { error } = await supabase.from("broadcasts").insert({ title, message, type, active: true });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function toggleBroadcast(id: string, active: boolean) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Akses ditolak." };

  const supabase = getServiceClient();
  const { error } = await supabase.from("broadcasts").update({ active }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBroadcast(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Akses ditolak." };

  const supabase = getServiceClient();
  const { error } = await supabase.from("broadcasts").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
