"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// We use service client to bypass RLS for inserting push subscriptions
function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function savePushSubscription(subscription: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    return { error: "Invalid subscription" };
  }

  const serviceClient = getServiceClient();
  
  // Upsert subscription based on user_id and endpoint (although endpoint is UNIQUE)
  const { error } = await serviceClient
    .from("push_subscriptions")
    .upsert({
      user_id: user.id,
      endpoint: endpoint,
      auth: keys.auth,
      p256dh: keys.p256dh,
    }, { onConflict: "endpoint" });

  if (error) {
    console.error("Failed to save push subscription", error);
    return { error: error.message };
  }

  return { success: true };
}
