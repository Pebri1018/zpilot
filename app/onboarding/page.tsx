import { OnboardingForm } from "@/app/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] px-5 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))] text-neutral-900 antialiased">
      <div className="mx-auto max-w-md">
        <header className="pb-8">
          <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Lengkapi profil</h1>
          <p className="mt-2 text-[0.95rem] text-neutral-600">
            Sekali isi — dipakai di akun Anda.
          </p>
        </header>

        <OnboardingForm />
      </div>
    </div>
  );
}
