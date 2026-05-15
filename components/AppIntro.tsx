"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function AppIntro({ children, authenticated, role }: { children: React.ReactNode, authenticated: boolean, role: string }) {
  const [step, setStep] = useState<"splash1" | "splash2" | "ready">("splash1");
  const [isReturning, setIsReturning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem("zpilot_seen_intro");
    setIsReturning(!!seen || authenticated);

    // Initial Splash 1 (Logo)
    const timer1 = setTimeout(() => {
      if (authenticated) {
        // Direct redirect if already logged in
        router.replace(role === "admin" ? "/admin" : "/beranda");
      } else if (seen) {
        // Skip tutorial but stay on landing
        setStep("ready");
      } else {
        // Show tutorial
        setStep("splash2");
      }
    }, 2000);

    return () => clearTimeout(timer1);
  }, [authenticated, role, router]);

  const handleFinish = () => {
    localStorage.setItem("zpilot_seen_intro", "true");
    setStep("ready");
  };

  if (step === "splash1") {
    return (
      <div 
        onClick={() => setStep("splash2")}
        className="fixed inset-0 z-[9999] bg-[#2d5af1] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500 cursor-pointer"
      >
        <div className="w-24 h-24 rounded-[2rem] border-[1.5rem] border-white/10 flex items-center justify-center mb-6 overflow-hidden shadow-2xl relative">
          <img src="/logo.png" alt="ZPILOT" className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-2 border-white/40 rounded-[2rem]" />
        </div>
        <h1 className="text-[2.5rem] font-black tracking-tight leading-none">ZPILOT</h1>
        <p className="absolute bottom-12 text-[0.7rem] font-bold tracking-[0.2em] opacity-60 uppercase">Smart Navigation for Drivers</p>
      </div>
    );
  }

  if (step === "splash2") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f0f7ff] flex flex-col items-center justify-between p-8 text-neutral-900 animate-in slide-in-from-right duration-700">
        <div className="flex items-center gap-2 pt-12">
          <div className="w-8 h-8 rounded-xl bg-[#2d5af1] flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo.png" alt="ZPILOT" className="w-full h-full object-cover" />
          </div>
          <span className="text-[1.5rem] font-black tracking-tight text-[#2d5af1]">ZPILOT</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          <div className="w-full aspect-square relative mb-12 flex items-center justify-center">
            <img 
              src="/driver_illustration.png" 
              alt="Illustration" 
              className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(45,90,241,0.2)] animate-in zoom-in-95 duration-1000 delay-300"
            />
          </div>
          <h2 className="text-[1.8rem] font-black text-center leading-tight tracking-tight text-neutral-800">
            PANTAU ZONA.<br/>CARI PELUANG.
          </h2>
          <p className="text-[0.95rem] text-neutral-500 font-medium text-center mt-4 max-w-[280px]">
            Dapatkan informasi hotspot real-time dan tingkatkan pendapatan harianmu.
          </p>
        </div>

        <div className="w-full max-w-sm pb-8">
          <button 
            onClick={handleFinish}
            className="w-full bg-[#2d5af1] text-white py-4 rounded-2xl text-[1rem] font-black shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
          >
            Lanjutkan
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
