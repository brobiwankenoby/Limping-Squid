import type { TrainingPlan, WizardAnswers } from "@/lib/types";

const STORAGE_KEY = "limpingsquid:draft-v1";
const VERSION = 1 as const;

export interface PlanDraft {
  version: typeof VERSION;
  savedAt: string;
  answers: WizardAnswers;
  plan: TrainingPlan | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function looksLikeAnswers(value: unknown): value is WizardAnswers {
  return (
    isObject(value) &&
    typeof value.horizon === "string" &&
    typeof value.ageGroup === "string" &&
    typeof value.level === "string" &&
    typeof value.sessionsPerWeek === "number" &&
    typeof value.sessionLength === "number" &&
    Array.isArray(value.focusAreas)
  );
}

function looksLikePlan(value: unknown): value is TrainingPlan {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.horizon === "string" &&
    Array.isArray(value.phases) &&
    looksLikeAnswers(value.answers)
  );
}

function parseDraft(raw: string): PlanDraft | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || data.version !== VERSION) return null;
    if (!looksLikeAnswers(data.answers)) return null;
    if (data.plan !== null && !looksLikePlan(data.plan)) return null;
    return {
      version: VERSION,
      savedAt:
        typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
      answers: data.answers,
      plan: data.plan,
    };
  } catch {
    return null;
  }
}

export function loadDraft(): PlanDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseDraft(raw);
  } catch {
    return null;
  }
}

export function saveDraft(input: {
  answers: WizardAnswers;
  plan: TrainingPlan | null;
}): void {
  if (typeof window === "undefined") return;
  const draft: PlanDraft = {
    version: VERSION,
    savedAt: new Date().toISOString(),
    answers: input.answers,
    plan: input.plan,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota / private mode — fail silently.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
