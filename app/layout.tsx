import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LocationProvider } from "@/hooks/useLocation";
import { LanguageProvider } from "@/context/LanguageContext";
import { PushSubscriptionManager } from "@/components/PushSubscriptionManager";
import { InactivityTimer } from "@/components/InactivityTimer";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZTIPS Pilot",
  description: "Pendamping lapangan untuk driver ShopeeFood",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZTIPS Pilot",
  },
};

export const viewport: Viewport = {
  themeColor: "#00A651",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={plusJakartaSans.className}>
        <LanguageProvider>
          <LocationProvider>
            <PushSubscriptionManager />
            <InactivityTimer />
            {children}
          </LocationProvider>
        </LanguageProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var hour = new Date().getHours();
                  if (hour >= 18 || hour < 6) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
              
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                      console.log('ServiceWorker unregistered successfully');
                    }
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
