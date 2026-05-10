"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { verifyAdmin } from "@/app/admin/actions";
import { revalidatePath } from "next/cache";

function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function saveFounderNote(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const type = String(formData.get("type") || "lainnya");
  const area = String(formData.get("area") || "");
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;
  const notes = String(formData.get("notes") || "");

  if (!notes.trim()) return { error: "Catatan tidak boleh kosong" };

  const supabase = getServiceClient();
  const { error } = await supabase.from("founder_notes").insert({
    type,
    area: area || null,
    lat: lat && !isNaN(lat) ? lat : null,
    lng: lng && !isNaN(lng) ? lng : null,
    notes,
  });

  if (error) {
    console.error("Error saving founder note:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function saveNgetemSpot(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const name = String(formData.get("name") || "");
  const area = String(formData.get("area") || "");
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;
  const quality = String(formData.get("quality") || "Bagus");
  const best_hours = String(formData.get("best_hours") || "");
  const notes = String(formData.get("notes") || "");

  if (!name.trim() || !area.trim()) return { error: "Nama dan area wajib diisi" };

  const supabase = getServiceClient();
  const { error } = await supabase.from("ngetem_spots").insert({
    name,
    area,
    lat: lat && !isNaN(lat) ? lat : null,
    lng: lng && !isNaN(lng) ? lng : null,
    quality,
    best_hours: best_hours || null,
    notes: notes || null,
  });

  if (error) {
    console.error("Error saving ngetem spot:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
