"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function InactivityTimer() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    alert("Sesi berakhir karena tidak ada aktivitas. Silakan login kembali.");
    router.push("/login");
    router.refresh();
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
