"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Beranda" },
  { href: "/radar", label: "Radar" },
  { href: "/tren", label: "Tren" },
  { href: "/akun", label: "Akun" },
] as const;

export function DriverBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/90 bg-white/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
      aria-label="Menu utama"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-1">
        {items.map(({ href, label }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`py-2 text-center text-[0.72rem] font-medium leading-tight transition-colors sm:text-[0.78rem] ${
                active ? "text-neutral-900" : "text-neutral-400 active:text-neutral-600"
              }`}
            >
              {label}
              <span
                className={`mx-auto mt-1 block h-0.5 w-4 rounded-full transition-colors ${
                  active ? "bg-neutral-900" : "bg-transparent"
                }`}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
