"use client";

import { useState, useEffect } from "react";
import { submitRecommendationFeedback } from "@/app/actions/feedback";

type AIFeedbackProps = {
  title: string;
  zone: string;
  idleMinutes: number;
  lang: string;
};

export function AIFeedback({ title, zone, idleMinutes, lang }: AIFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const isID = lang === "ID";

  useEffect(() => {
    // Reset submitted state when the recommendation title changes significantly
    setSubmitted(false);
  }, [title]);

  if (submitted) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 bg-neutral-50 py-3 rounded-2xl border border-neutral-100">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        <span className="text-[0.75rem] font-bold text-neutral-500">{isID ? "Terima kasih atas masukannya!" : "Thanks for the feedback!"}</span>
      </div>
    );
  }

  const handleFeedback = async (result: "dapat_order" | "biasa" | "gagal") => {
    setSubmitted(true);
    await submitRecommendationFeedback(title, zone, result, idleMinutes);
  };

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-2.5 text-center">
        {isID ? "Apakah saran ini membantu?" : "Was this helpful?"}
      </p>
      <div className="flex gap-2">
        <button 
          onClick={() => handleFeedback("dapat_order")}
          className="flex-1 bg-green-50 text-green-700 font-bold text-[0.75rem] py-2.5 rounded-xl border border-green-100 active:scale-95 transition-transform"
        >
          👍 {isID ? "Dapat Order" : "Got Order"}
        </button>
        <button 
          onClick={() => handleFeedback("biasa")}
          className="flex-1 bg-neutral-50 text-neutral-600 font-bold text-[0.75rem] py-2.5 rounded-xl border border-neutral-200 active:scale-95 transition-transform"
        >
          😐 {isID ? "Biasa" : "Neutral"}
        </button>
        <button 
          onClick={() => handleFeedback("gagal")}
          className="flex-1 bg-red-50 text-red-600 font-bold text-[0.75rem] py-2.5 rounded-xl border border-red-100 active:scale-95 transition-transform"
        >
          👎 {isID ? "Gagal" : "Failed"}
        </button>
      </div>
    </div>
  );
}
