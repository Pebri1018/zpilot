"use client";

import { useEffect } from "react";
import { savePushSubscription } from "@/app/actions/push";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscriptionManager() {
  useEffect(() => {
    async function setupPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (!publicVapidKey) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Wait for user interaction if permission is default, or just proceed if granted
        if (Notification.permission === "default") {
          // We don't ask immediately to avoid spamming the user, 
          // usually better to attach to a button click, but for MVP:
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;
        } else if (Notification.permission !== "granted") {
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
          });
        }

        await savePushSubscription(JSON.parse(JSON.stringify(subscription)));
      } catch (err) {
        console.error("Push registration failed", err);
      }
    }

    // Delay slightly to not block initial render
    const timeoutId = setTimeout(setupPush, 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
