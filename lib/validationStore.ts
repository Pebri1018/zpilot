export type FeedbackType = "accurate" | "not_helpful";
/** New move outcomes; legacy strings from older builds still display in history. */
export type MoveOutcomeType = "<5 min" | "5-10 min" | "10+ min" | "No Order";

export type ValidationRecord = {
  id: string;
  timestamp: string;
  zone: string;
  suggestion: string;
  feedback: FeedbackType | null;
  result: MoveOutcomeType | null;
};

const STORAGE_KEY = "ztips_validation_records";

export function readValidationRecords(): ValidationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ValidationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveValidationRecords(records: ValidationRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function appendValidationRecord(
  payload: Omit<ValidationRecord, "id" | "timestamp">,
): ValidationRecord[] {
  const current = readValidationRecords();
  const next: ValidationRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  const updated = [next, ...current];
  saveValidationRecords(updated);
  return updated;
}

