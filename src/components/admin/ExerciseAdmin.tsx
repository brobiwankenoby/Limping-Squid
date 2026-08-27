"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useExerciseCatalog } from "@/components/ExerciseCatalogProvider";
import { EquipmentPicker } from "@/components/EquipmentPicker";
import { Logo } from "@/components/Logo";
import { Chip, Field } from "@/components/ui";
import {
  AGE_LABELS,
  EQUIPMENT_LABELS,
  FOCUS_LABELS,
  LEVEL_LABELS,
  PHASE_LABELS,
} from "@/lib/labels";
import {
  EXERCISE_CATEGORIES,
  categoryForExercise,
  youtubeId,
} from "@/lib/exercise-utils";
import type { ExerciseOverride } from "@/lib/exercise-catalog";
import type {
  AgeGroup,
  Equipment,
  Exercise,
  FocusZone,
  Gender,
  Level,
  Phase,
} from "@/lib/types";

const ALL_AGES = Object.keys(AGE_LABELS) as AgeGroup[];
const ALL_LEVELS = Object.keys(LEVEL_LABELS) as Level[];
const ALL_FOCUS = Object.keys(FOCUS_LABELS) as FocusZone[];
const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Equipment[];
const ALL_PHASES = Object.keys(PHASE_LABELS) as Phase[];
const GENDERS: Gender[] = ["any", "men", "women"];

const GENDER_LABELS: Record<Gender, string> = {
  any: "Any",
  men: "Men",
  women: "Women",
};

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function ExerciseAdmin() {
  const {
    exercises,
    localEditCount,
    updateExercise,
    resetExercise,
    resetAllLocal,
    exportJson,
    importJson,
    localOverrides,
  } = useExerciseCatalog();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [missingOnly, setMissingOnly] = useState(false);
  const [saved, setSaved] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (category !== "All" && categoryForExercise(ex) !== category) return false;
      if (missingOnly && youtubeId(ex.videoUrl)) return false;
      if (!q) return true;
      const code = ex.sourceCode?.toString() ?? "";
      return (
        ex.name.toLowerCase().includes(q) ||
        code.includes(q) ||
        ex.id.toLowerCase().includes(q)
      );
    });
  }, [exercises, search, category, missingOnly]);

  const effectiveSelectedId =
    selectedId && filtered.some((ex) => ex.id === selectedId)
      ? selectedId
      : (filtered[0]?.id ?? null);

  const selected = exercises.find((ex) => ex.id === effectiveSelectedId) ?? null;

  const scheduleSave = useCallback(
    (id: string, patch: Parameters<typeof updateExercise>[1]) => {
      setSaved(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateExercise(id, patch);
        setSaved(true);
      }, 300);
    },
    [updateExercise]
  );

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exercise-overrides.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result)) as Record<string, unknown>;
        importJson(json as Parameters<typeof importJson>[0], true);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const missingCount = exercises.filter((ex) => ex.sourceCode && !youtubeId(ex.videoUrl)).length;

  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-40 border-b border-sand-2 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-squid/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
              Admin
            </span>
            {localEditCount > 0 && (
              <span className="text-sm text-ink/60">
                {localEditCount} unsaved locally — export &amp; commit to share
              </span>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border-2 border-sand-2 px-4 py-2 text-sm font-semibold text-ink hover:border-brand"
            >
              Export overrides
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full border-2 border-sand-2 px-4 py-2 text-sm font-semibold text-ink hover:border-brand"
            >
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-0 md:grid-cols-[320px_1fr] md:px-6 md:py-6">
        {/* List panel */}
        <aside className="border-b border-sand-2 bg-white md:rounded-l-2xl md:border md:border-r-0">
          <div className="space-y-3 border-b border-sand-2 p-4">
            <input
              type="search"
              placeholder="Search name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-sand-2 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={missingOnly}
                onClick={() => setMissingOnly((v) => !v)}
                label={`Missing video (${missingCount})`}
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-sand-2 px-3 py-2 text-sm"
            >
              {EXERCISE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink/50">
              {filtered.length} drill{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="max-h-[50vh] overflow-y-auto md:max-h-[calc(100vh-220px)]">
            {filtered.map((ex) => {
              const hasVideo = !!youtubeId(ex.videoUrl);
              const isLocal = !!localOverrides[ex.id];
              return (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ex.id)}
                    className={`w-full border-b border-sand-2/60 px-4 py-3 text-left transition hover:bg-sand/60 ${
                      effectiveSelectedId === ex.id ? "bg-brand/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{ex.name}</span>
                      <span className="flex shrink-0 gap-1">
                        {hasVideo && (
                          <span className="rounded bg-court/15 px-1.5 py-0.5 text-[10px] font-bold text-court-dark">
                            ▶
                          </span>
                        )}
                        {isLocal && (
                          <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">
                            ●
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-ink/50">
                      {ex.sourceCode ? `#${ex.sourceCode}` : "stub"} ·{" "}
                      {categoryForExercise(ex)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Edit panel */}
        <section className="bg-white p-4 md:rounded-r-2xl md:border md:border-l-0 md:p-8">
          {!selected ? (
            <p className="text-ink/50">Select a drill to edit.</p>
          ) : (
            <ExerciseForm
              key={selected.id}
              exercise={selected}
              saved={saved}
              onChange={(patch) => scheduleSave(selected.id, patch)}
              onReset={() => resetExercise(selected.id)}
            />
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-ink/40 md:px-6">
        Replace <code className="text-ink/60">data/exercise-overrides.json</code> with
        exported file, then commit and push so your friend can{" "}
        <code className="text-ink/60">git pull</code>.
        {localEditCount > 0 && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all local unsaved edits on this browser?")) {
                  resetAllLocal();
                }
              }}
              className="text-brand-dark underline"
            >
              Reset all local edits
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

function ExerciseForm({
  exercise,
  saved,
  onChange,
  onReset,
}: {
  exercise: Exercise;
  saved: boolean;
  onChange: (patch: ExerciseOverride) => void;
  onReset: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const vid = youtubeId(exercise.videoUrl);

  const setField = <K extends keyof Exercise>(key: K, value: Exercise[K]) => {
    onChange({ [key]: value } as Parameters<typeof onChange>[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/40">
            {categoryForExercise(exercise)}
            {exercise.sourceCode ? ` · ${exercise.sourceCode}` : ""}
          </p>
          <h1 className="font-display text-2xl font-black text-ink">{exercise.name}</h1>
          <p className="mt-1 text-sm text-ink/50">{exercise.id}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={saved ? "text-court-dark" : "text-ink/40"}>
            {saved ? "Saved" : "Saving…"}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-sand-2 px-3 py-1 text-xs font-semibold hover:border-brand"
          >
            Reset drill
          </button>
        </div>
      </div>

      <Field label="Name">
        <input
          className="w-full rounded-lg border border-sand-2 px-3 py-2"
          value={exercise.name}
          onChange={(e) => setField("name", e.target.value)}
        />
      </Field>

      <Field label="Video URL" hint="YouTube watch or youtu.be link">
        <input
          className="w-full rounded-lg border border-sand-2 px-3 py-2"
          value={exercise.videoUrl ?? ""}
          placeholder="https://www.youtube.com/watch?v=…"
          onChange={(e) => setField("videoUrl", e.target.value || undefined)}
        />
      </Field>

      {vid && (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${vid}`}
            title={exercise.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <Field label="Description">
        <textarea
          className="min-h-24 w-full rounded-lg border border-sand-2 px-3 py-2 text-sm"
          value={exercise.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </Field>

      <Field label="Skills promoted">
        <div className="flex flex-wrap gap-2">
          {ALL_FOCUS.map((f) => (
            <Chip
              key={f}
              selected={exercise.focusZones.includes(f)}
              onClick={() => setField("focusZones", toggle(exercise.focusZones, f))}
              label={FOCUS_LABELS[f]}
            />
          ))}
        </div>
      </Field>

      <Field label="Equipment required">
        <EquipmentPicker
          options={ALL_EQUIPMENT}
          selected={exercise.equipment}
          onToggle={(e) => setField("equipment", toggle(exercise.equipment, e))}
        />
      </Field>

      <Field label="Age groups">
        <div className="flex flex-wrap gap-2">
          {ALL_AGES.map((a) => (
            <Chip
              key={a}
              selected={exercise.ageGroups.includes(a)}
              onClick={() => setField("ageGroups", toggle(exercise.ageGroups, a))}
              label={AGE_LABELS[a]}
            />
          ))}
        </div>
      </Field>

      <Field label="Competition levels">
        <div className="flex flex-wrap gap-2">
          {ALL_LEVELS.map((l) => (
            <Chip
              key={l}
              selected={exercise.levels.includes(l)}
              onClick={() => setField("levels", toggle(exercise.levels, l))}
              label={LEVEL_LABELS[l]}
            />
          ))}
        </div>
      </Field>

      <Field label="Gender">
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Chip
              key={g}
              selected={exercise.gender === g}
              onClick={() => setField("gender", g)}
              label={GENDER_LABELS[g]}
            />
          ))}
        </div>
      </Field>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-sm font-semibold text-brand-dark hover:underline"
      >
        {showAdvanced ? "Hide advanced" : "Show advanced"}
      </button>

      {showAdvanced && (
        <div className="space-y-4 rounded-xl border border-sand-2 p-4">
          <Field label="Default duration (minutes)">
            <input
              type="number"
              min={1}
              className="w-24 rounded-lg border border-sand-2 px-3 py-2"
              value={exercise.durationMin}
              onChange={(e) => setField("durationMin", Number(e.target.value))}
            />
          </Field>
          <Field label="Difficulty (1–5)">
            <input
              type="number"
              min={1}
              max={5}
              className="w-24 rounded-lg border border-sand-2 px-3 py-2"
              value={exercise.difficulty}
              onChange={(e) =>
                setField("difficulty", Math.min(5, Math.max(1, Number(e.target.value))) as Exercise["difficulty"])
              }
            />
          </Field>
          <div className="flex gap-4">
            <Field label="Min players">
              <input
                type="number"
                min={1}
                className="w-24 rounded-lg border border-sand-2 px-3 py-2"
                value={exercise.minPlayers}
                onChange={(e) => setField("minPlayers", Number(e.target.value))}
              />
            </Field>
            <Field label="Max players">
              <input
                type="number"
                min={1}
                className="w-24 rounded-lg border border-sand-2 px-3 py-2"
                value={exercise.maxPlayers}
                onChange={(e) => setField("maxPlayers", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Season phases">
            <div className="flex flex-wrap gap-2">
              {ALL_PHASES.map((p) => (
                <Chip
                  key={p}
                  selected={exercise.phases.includes(p)}
                  onClick={() => setField("phases", toggle(exercise.phases, p))}
                  label={PHASE_LABELS[p]}
                />
              ))}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}
