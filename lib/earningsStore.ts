const STORAGE_KEY = "ztips_today_earnings";

export type TodayEarningsState = {
  date: string;
  amount: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function readTodayEarnings(): TodayEarningsState {
  if (typeof window === "undefined") {
    return { date: todayKey(), amount: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { date: todayKey(), amount: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<TodayEarningsState>;
    const date = typeof parsed.date === "string" ? parsed.date : todayKey();
    const amount = typeof parsed.amount === "number" && !Number.isNaN(parsed.amount) ? Math.max(0, parsed.amount) : 0;
    const current = todayKey();
    if (date !== current) {
      return { date: current, amount: 0 };
    }
    return { date: current, amount };
  } catch {
    return { date: todayKey(), amount: 0 };
  }
}

export function saveTodayEarnings(amount: number): void {
  if (typeof window === "undefined") return;
  const payload: TodayEarningsState = {
    date: todayKey(),
    amount: Math.max(0, Math.floor(amount)),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
