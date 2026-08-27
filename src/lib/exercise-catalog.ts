import sharedOverrides from "../../data/exercise-overrides.json";
import { EXERCISES } from "./exercises";
import type { Exercise } from "./types";

const STORAGE_KEY = "limpingsquid:exercise-overrides-v1";

export type ExerciseOverride = Partial<
  Pick<
    Exercise,
    | "name"
    | "description"
    | "videoUrl"
    | "focusZones"
    | "ageGroups"
    | "levels"
    | "gender"
    | "equipment"
    | "difficulty"
    | "durationMin"
    | "minPlayers"
    | "maxPlayers"
    | "phases"
  >
>;

export type ExerciseOverrides = Record<string, ExerciseOverride>;

const shared = sharedOverrides as ExerciseOverrides;

function mergeExercise(base: Exercise, ...layers: ExerciseOverride[]): Exercise {
  const merged = { ...base };
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }
  return merged;
}

export function loadLocalOverrides(): ExerciseOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as ExerciseOverrides;
  } catch {
    return {};
  }
}

export function saveLocalOverrides(overrides: ExerciseOverrides): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Quota / private mode
  }
}

export function getSharedOverrides(): ExerciseOverrides {
  return shared;
}

/** Merged catalog: base → committed JSON → localStorage. */
export function getExercises(
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): Exercise[] {
  return EXERCISES.map((ex) => {
    const sharedPatch = shared[ex.id];
    const localPatch = localOverrides[ex.id];
    if (!sharedPatch && !localPatch) return ex;
    return mergeExercise(ex, sharedPatch ?? {}, localPatch ?? {});
  });
}

export function getExerciseById(
  id: string,
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): Exercise | undefined {
  return getExercises(localOverrides).find((ex) => ex.id === id);
}

export function updateLocalExercise(
  id: string,
  patch: ExerciseOverride,
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): ExerciseOverrides {
  const next = { ...localOverrides };
  next[id] = { ...next[id], ...patch };
  saveLocalOverrides(next);
  return next;
}

export function resetLocalExercise(
  id: string,
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): ExerciseOverrides {
  const next = { ...localOverrides };
  delete next[id];
  saveLocalOverrides(next);
  return next;
}

export function clearLocalOverrides(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Full override set for export (shared + local merged per drill). */
export function exportMergedOverrides(
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): ExerciseOverrides {
  const out: ExerciseOverrides = { ...shared };
  for (const [id, patch] of Object.entries(localOverrides)) {
    out[id] = { ...out[id], ...patch };
  }
  return out;
}

export function importLocalOverrides(
  json: ExerciseOverrides,
  merge = true
): ExerciseOverrides {
  const next = merge ? { ...loadLocalOverrides(), ...json } : { ...json };
  saveLocalOverrides(next);
  return next;
}

export function countLocalEdits(
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): number {
  return Object.keys(localOverrides).length;
}

export function hasLocalEdits(
  localOverrides: ExerciseOverrides = loadLocalOverrides()
): boolean {
  return countLocalEdits(localOverrides) > 0;
}
