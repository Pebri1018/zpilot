"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { revalidatePath } from "next/cache";
import webpush from "web-push";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.PRIVATE_VAPID_KEY) {
  webpush.setVapidDetails(
    "mailto:hello@ztips.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.PRIVATE_VAPID_KEY
  );
}

export type BroadcastType = "spot_ramai" | "hindari_area" | "promo_seller" | "paket_spx" | "cuaca_event";

export type Broadcast = {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  active: boolean;
  created_at: string;
  expires_at?: string;
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
  const now = new Date().toISOString();
  
  const { data } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("active", true)
    .gt("expires_at", now) // Only if not expired
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  return data ?? null;
}

export async function createBroadcast(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return;

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const type = String(formData.get("type") ?? "") as BroadcastType;

  if (!title || !message || !type) return;

  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins from now

  const supabase = getServiceClient();
  const { error } = await supabase.from("broadcasts").insert({ 
    title, 
    message, 
    type, 
    active: true,
    expires_at 
  });

  if (error) {
    console.error(error);
    return;
  }

  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.PRIVATE_VAPID_KEY) {
    const { data: subs } = await supabase.from("push_subscriptions").select("*");
    if (subs && subs.length > 0) {
      const payload = JSON.stringify({ title, message, url: "/" });
      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            const pushSub = { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } };
            await webpush.sendNotification(pushSub, payload);
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        })
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleBroadcast(id: string, active: boolean) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return;

  const supabase = getServiceClient();
  const { error } = await supabase.from("broadcasts").update({ active }).eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBroadcast(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return;

  const supabase = getServiceClient();
  const { error } = await supabase.from("broadcasts").delete().eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}
