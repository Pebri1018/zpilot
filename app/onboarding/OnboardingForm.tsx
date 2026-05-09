"use client";

import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "@/app/onboarding/actions";

const initial: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboarding, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="nama"
          className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400"
        >
          Nama panggilan
        </label>
        <input
          id="nama"
          name="nama"
          required
          autoComplete="nickname"
          placeholder="Contoh: Bang Adi"
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label
          htmlFor="kota"
          className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400"
        >
          Kota
        </label>
        <input
          id="kota"
          name="kota"
          required
          autoComplete="address-level2"
          placeholder="Contoh: Yogyakarta"
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label
          htmlFor="platform"
          className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400"
        >
          Platform
        </label>
        <input
          id="platform"
          name="platform"
          readOnly
          defaultValue="ShopeeFood"
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-[1.05rem] text-neutral-700 outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="driver_id"
          className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400"
        >
          ID Driver <span className="font-normal normal-case text-neutral-400">(opsional)</span>
        </label>
        <input
          id="driver_id"
          name="driver_id"
          autoComplete="off"
          placeholder="Opsional"
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] outline-none transition focus:border-neutral-400"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-[#00AA13] py-4 text-[1.05rem] font-semibold text-white transition enabled:active:opacity-90 disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Lanjutkan"}
      </button>
    </form>
  );
}
