"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearLocalOverrides,
  exportMergedOverrides,
  getExercises,
  importLocalOverrides,
  loadLocalOverrides,
  resetLocalExercise,
  updateLocalExercise,
  type ExerciseOverride,
  type ExerciseOverrides,
} from "@/lib/exercise-catalog";
import type { Exercise } from "@/lib/types";

interface CatalogContextValue {
  exercises: Exercise[];
  localOverrides: ExerciseOverrides;
  localEditCount: number;
  refresh: () => void;
  updateExercise: (id: string, patch: ExerciseOverride) => void;
  resetExercise: (id: string) => void;
  resetAllLocal: () => void;
  exportJson: () => string;
  importJson: (json: ExerciseOverrides, merge: boolean) => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function ExerciseCatalogProvider({ children }: { children: ReactNode }) {
  const [localOverrides, setLocalOverrides] = useState<ExerciseOverrides>(() =>
    typeof window === "undefined" ? {} : loadLocalOverrides()
  );

  const refresh = useCallback(() => {
    setLocalOverrides(loadLocalOverrides());
  }, []);

  const exercises = useMemo(
    () => getExercises(localOverrides),
    [localOverrides]
  );

  const updateExercise = useCallback((id: string, patch: ExerciseOverride) => {
    setLocalOverrides((prev) => updateLocalExercise(id, patch, prev));
  }, []);

  const resetExercise = useCallback((id: string) => {
    setLocalOverrides((prev) => resetLocalExercise(id, prev));
  }, []);

  const resetAllLocal = useCallback(() => {
    clearLocalOverrides();
    setLocalOverrides({});
  }, []);

  const exportJson = useCallback(() => {
    return JSON.stringify(exportMergedOverrides(localOverrides), null, 2);
  }, [localOverrides]);

  const importJson = useCallback((json: ExerciseOverrides, merge: boolean) => {
    setLocalOverrides(importLocalOverrides(json, merge));
  }, []);

  const value: CatalogContextValue = {
    exercises,
    localOverrides,
    localEditCount: Object.keys(localOverrides).length,
    refresh,
    updateExercise,
    resetExercise,
    resetAllLocal,
    exportJson,
    importJson,
  };

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useExerciseCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useExerciseCatalog must be used within ExerciseCatalogProvider");
  }
  return ctx;
}
