"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { defaultPracticeDays, generatePlan } from "@/lib/generator";
import {
  AGE_LABELS,
  DAY_LABELS,
  DAY_SHORT,
  EQUIPMENT_LABELS,
  FOCUS_LABELS,
  HORIZON_LABELS,
  LEVEL_LABELS,
  OBJECTIVE_LABELS,
  STRATEGY_LABELS,
} from "@/lib/labels";
import type {
  AgeGroup,
  DayOfWeek,
  Equipment,
  FocusZone,
  Horizon,
  Level,
  Objective,
  SelectionStrategy,
  TrainingPlan,
  WizardAnswers,
} from "@/lib/types";
import { DAYS_OF_WEEK, GAME_DAY_HORIZONS } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Chip, Field, NumberInput, OptionCard } from "@/components/ui";
import { PlanView } from "@/components/PlanView";

const SESSION_PRESETS = [60, 75, 90, 105, 120] as const;

const DEFAULTS: WizardAnswers = {
  horizon: "week",
  ageGroup: "U16",
  level: "club",
  rosterSize: 12,
  gender: "mixed",
  startDate: "",
  sessionsPerWeek: 3,
  sessionLength: 90,
  courts: 1,
  equipment: ["cart", "cones", "targets"],
  practiceDays: ["monday", "wednesday", "friday"],
  gameWeekdays: [],
  gameDates: [],
  focusAreas: ["passing", "attacking"],
  weakness: undefined,
  objective: "fundamentals",
  selectionStrategy: "variety",
};

const HORIZONS: Horizon[] = [
  "session",
  "week",
  "month",
  "half-season",
  "full-season",
  "playoff",
];
const AGES: AgeGroup[] = ["U12", "U14", "U16", "U18", "Adult"];
const LEVELS: Level[] = ["rec", "school", "club", "elite"];
const EQUIPMENT: Equipment[] = [
  "cart",
  "targets",
  "bands",
  "cones",
  "blocking-machine",
  "service-machine",
  "walls",
];
const FOCUS: FocusZone[] = [
  "serving",
  "passing",
  "setting",
  "attacking",
  "blocking",
  "defense",
  "serve-receive",
  "systems",
  "conditioning",
];
const OBJECTIVES: Objective[] = [
  "fundamentals",
  "tournament",
  "weakness",
  "fitness",
];
const STRATEGIES: SelectionStrategy[] = ["variety", "random", "progressive"];

type StepId =
  | "horizon"
  | "team"
  | "calendar"
  | "resources"
  | "goals"
  | "strategy"
  | "review";

const ALL_STEPS: { id: StepId; title: string }[] = [
  { id: "horizon", title: "Planning horizon" },
  { id: "team", title: "Your team" },
  { id: "calendar", title: "Calendar" },
  { id: "resources", title: "Time & resources" },
  { id: "goals", title: "Goals & focus" },
  { id: "strategy", title: "Drill selection" },
  { id: "review", title: "Review" },
];

export function Wizard() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<WizardAnswers>(DEFAULTS);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [customLength, setCustomLength] = useState(false);
  const [newGameDate, setNewGameDate] = useState("");
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setA(draft.answers);
      if (draft.plan) {
        setPlan(draft.plan);
        setRestored(true);
      }
    }
    setReady(true);
  }, []);

  const isSingleSession = a.horizon === "session";

  const steps = useMemo(
    () =>
      isSingleSession
        ? ALL_STEPS.filter((s) => s.id !== "calendar")
        : ALL_STEPS,
    [isSingleSession]
  );

  const current = steps[Math.min(step, steps.length - 1)];
  const stepId = current.id;

  const set = <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) =>
    setA((prev) => ({ ...prev, [key]: value }));

  const showGameDays = GAME_DAY_HORIZONS.includes(a.horizon);
  const needPracticeDays = !isSingleSession && a.sessionsPerWeek <= 4;

  const selectHorizon = (h: Horizon) => {
    setA((prev) => {
      const next: WizardAnswers = {
        ...prev,
        horizon: h,
      };
      if (h === "session") {
        next.startDate = "";
        next.gameWeekdays = [];
        next.gameDates = [];
        next.sessionsPerWeek = 1;
        next.practiceDays = [];
      } else if (!GAME_DAY_HORIZONS.includes(h)) {
        next.gameWeekdays = [];
        next.gameDates = [];
      }
      if (h !== "session" && prev.horizon === "session") {
        next.sessionsPerWeek = 3;
        next.practiceDays = defaultPracticeDays(3);
      }
      return next;
    });
  };

  const setSessionsPerWeek = (n: number) => {
    setA((prev) => ({
      ...prev,
      sessionsPerWeek: n,
      practiceDays: n <= 4 ? defaultPracticeDays(n) : [],
    }));
  };

  const toggleEquipment = (e: Equipment) =>
    set(
      "equipment",
      a.equipment.includes(e)
        ? a.equipment.filter((x) => x !== e)
        : [...a.equipment, e]
    );

  const toggleFocus = (f: FocusZone) => {
    if (a.focusAreas.includes(f)) {
      set(
        "focusAreas",
        a.focusAreas.filter((x) => x !== f)
      );
    } else if (a.focusAreas.length < 3) {
      set("focusAreas", [...a.focusAreas, f]);
    }
  };

  const togglePracticeDay = (day: DayOfWeek) => {
    const has = a.practiceDays.includes(day);
    if (has) {
      set(
        "practiceDays",
        a.practiceDays.filter((d) => d !== day)
      );
      return;
    }
    if (a.practiceDays.length >= a.sessionsPerWeek) return;
    set("practiceDays", [...a.practiceDays, day]);
  };

  const toggleGameWeekday = (day: DayOfWeek) => {
    set(
      "gameWeekdays",
      a.gameWeekdays.includes(day)
        ? a.gameWeekdays.filter((d) => d !== day)
        : [...a.gameWeekdays, day]
    );
  };

  const addGameDate = () => {
    if (!newGameDate) return;
    if (a.gameDates.includes(newGameDate)) {
      setNewGameDate("");
      return;
    }
    set("gameDates", [...a.gameDates, newGameDate].sort());
    setNewGameDate("");
  };

  const removeGameDate = (date: string) =>
    set(
      "gameDates",
      a.gameDates.filter((d) => d !== date)
    );

  const canContinue = useMemo(() => {
    switch (stepId) {
      case "team":
        return a.rosterSize > 0 && a.rosterSize <= 30;
      case "resources":
        if (a.sessionLength < 30 || a.sessionLength > 240) return false;
        if (needPracticeDays && a.practiceDays.length !== a.sessionsPerWeek)
          return false;
        return true;
      case "goals":
        return a.focusAreas.length > 0;
      default:
        return true;
    }
  }, [stepId, a, needPracticeDays]);

  const isLast = step === steps.length - 1;

  const generate = () => {
    const next = generatePlan(a);
    setPlan(next);
    setRestored(false);
    saveDraft({ answers: a, plan: next });
  };

  const handlePlanChange = useCallback((next: TrainingPlan) => {
    saveDraft({ answers: next.answers, plan: next });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand text-sm text-ink/50">
        Loading…
      </div>
    );
  }

  if (plan) {
    return (
      <PlanView
        plan={plan}
        restored={restored}
        onDismissRestored={() => setRestored(false)}
        onPlanChange={handlePlanChange}
        onRestart={() => {
          clearDraft();
          setPlan(null);
          setA(DEFAULTS);
          setStep(0);
          setRestored(false);
          setCustomLength(false);
        }}
        onEdit={() => {
          saveDraft({ answers: a, plan: null });
          setPlan(null);
          setRestored(false);
          setStep(0);
        }}
      />
    );
  }

  const progress = ((step + 1) / steps.length) * 100;
  const isPresetLength = (SESSION_PRESETS as readonly number[]).includes(
    a.sessionLength
  );

  return (
    <div className="min-h-screen bg-sand">
      <header className="no-print border-b border-sand-2 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-sm font-semibold text-ink/50">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="h-1.5 w-full bg-sand-2">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl font-black text-ink">
          {current.title}
        </h1>

        <div className="mt-8">
          {stepId === "horizon" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {HORIZONS.map((h) => (
                <OptionCard
                  key={h}
                  selected={a.horizon === h}
                  onClick={() => selectHorizon(h)}
                  title={HORIZON_LABELS[h]}
                  subtitle={horizonSubtitle(h)}
                />
              ))}
            </div>
          )}

          {stepId === "team" && (
            <div className="space-y-8">
              <Field label="Age group">
                <div className="flex flex-wrap gap-2">
                  {AGES.map((ag) => (
                    <Chip
                      key={ag}
                      selected={a.ageGroup === ag}
                      onClick={() => set("ageGroup", ag)}
                      label={AGE_LABELS[ag]}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Competitive level">
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((lv) => (
                    <Chip
                      key={lv}
                      selected={a.level === lv}
                      onClick={() => set("level", lv)}
                      label={LEVEL_LABELS[lv]}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Roster size" hint="max 30">
                <NumberInput
                  value={a.rosterSize}
                  onChange={(n) => set("rosterSize", n)}
                  min={1}
                  max={30}
                />
              </Field>
              <Field label="Team">
                <div className="flex flex-wrap gap-2">
                  {(["men", "women", "mixed"] as const).map((g) => (
                    <Chip
                      key={g}
                      selected={a.gender === g}
                      onClick={() => set("gender", g)}
                      label={g[0].toUpperCase() + g.slice(1)}
                    />
                  ))}
                </div>
              </Field>
            </div>
          )}

          {stepId === "calendar" && (
            <div className="space-y-8">
              <p className="text-ink/70">
                Optional start date helps line phases up with your calendar
                {showGameDays
                  ? " and map specific game dates into the plan"
                  : ""}
                .
              </p>
              <Field label="Plan start date" hint="optional">
                <input
                  type="date"
                  value={a.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="rounded-lg border-2 border-sand-2 bg-white px-3 py-2 text-ink outline-none focus:border-brand"
                />
              </Field>

              {showGameDays && (
                <>
                  <Field
                    label="Recurring game day(s)"
                    hint="e.g. every Sunday"
                  >
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Chip
                          key={day}
                          selected={a.gameWeekdays.includes(day)}
                          onClick={() => toggleGameWeekday(day)}
                          label={DAY_SHORT[day]}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-ink/50">
                      Practices the day before or after a game are automatically
                      lightened.
                    </p>
                  </Field>

                  <Field
                    label="Specific game dates"
                    hint="one-off or irregular fixtures"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={newGameDate}
                        onChange={(e) => setNewGameDate(e.target.value)}
                        className="rounded-lg border-2 border-sand-2 bg-white px-3 py-2 text-ink outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={addGameDate}
                        disabled={!newGameDate}
                        className="rounded-full bg-court px-4 py-2 text-sm font-semibold text-white transition hover:bg-court-dark disabled:opacity-40"
                      >
                        Add date
                      </button>
                    </div>
                    {a.gameDates.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {a.gameDates.map((date) => (
                          <li
                            key={date}
                            className="flex items-center justify-between rounded-lg border border-sand-2 bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-ink">
                              {formatDate(date)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeGameDate(date)}
                              className="text-brand hover:underline"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Field>
                </>
              )}
            </div>
          )}

          {stepId === "resources" && (
            <div className="space-y-8">
              {!isSingleSession && (
                <Field label="Sessions per week">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Chip
                        key={n}
                        selected={a.sessionsPerWeek === n}
                        onClick={() => setSessionsPerWeek(n)}
                        label={`${n}`}
                      />
                    ))}
                  </div>
                </Field>
              )}

              {needPracticeDays && (
                <Field
                  label="Practice days"
                  hint={`pick exactly ${a.sessionsPerWeek}`}
                >
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Chip
                        key={day}
                        selected={a.practiceDays.includes(day)}
                        onClick={() => togglePracticeDay(day)}
                        label={DAY_SHORT[day]}
                        disabled={
                          !a.practiceDays.includes(day) &&
                          a.practiceDays.length >= a.sessionsPerWeek
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-ink/50">
                    We space hard sessions so you don’t stack three tough days
                    in a row
                    {a.practiceDays.length !== a.sessionsPerWeek
                      ? ` — select ${a.sessionsPerWeek - a.practiceDays.length} more`
                      : ""}
                    .
                  </p>
                </Field>
              )}

              <Field label="Session length" hint="plans stay within this time">
                <div className="flex flex-wrap gap-2">
                  {SESSION_PRESETS.map((n) => (
                    <Chip
                      key={n}
                      selected={!customLength && a.sessionLength === n}
                      onClick={() => {
                        setCustomLength(false);
                        set("sessionLength", n);
                      }}
                      label={`${n} min`}
                    />
                  ))}
                  <Chip
                    selected={customLength || !isPresetLength}
                    onClick={() => setCustomLength(true)}
                    label="Custom"
                  />
                </div>
                {(customLength || !isPresetLength) && (
                  <div className="mt-3 flex items-center gap-2">
                    <NumberInput
                      value={a.sessionLength}
                      onChange={(n) => set("sessionLength", n)}
                      min={30}
                      max={240}
                    />
                    <span className="text-sm text-ink/60">minutes</span>
                  </div>
                )}
              </Field>

              <Field label="Courts available">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip
                      key={n}
                      selected={a.courts === n}
                      onClick={() => set("courts", n)}
                      label={n === 3 ? "3+" : `${n}`}
                    />
                  ))}
                </div>
              </Field>
              <Field
                label="Equipment on hand"
                hint="volleyballs & net assumed available"
              >
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map((e) => (
                    <Chip
                      key={e}
                      selected={a.equipment.includes(e)}
                      onClick={() => toggleEquipment(e)}
                      label={EQUIPMENT_LABELS[e]}
                    />
                  ))}
                </div>
              </Field>
            </div>
          )}

          {stepId === "goals" && (
            <div className="space-y-8">
              <Field label="Focus areas" hint="pick up to 3">
                <div className="flex flex-wrap gap-2">
                  {FOCUS.map((f) => (
                    <Chip
                      key={f}
                      selected={a.focusAreas.includes(f)}
                      onClick={() => toggleFocus(f)}
                      label={FOCUS_LABELS[f]}
                      disabled={a.focusAreas.length >= 3}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Biggest weakness" hint="optional — gets extra time">
                <div className="flex flex-wrap gap-2">
                  <Chip
                    selected={!a.weakness}
                    onClick={() => set("weakness", undefined)}
                    label="None"
                  />
                  {FOCUS.map((f) => (
                    <Chip
                      key={f}
                      selected={a.weakness === f}
                      onClick={() => set("weakness", f)}
                      label={FOCUS_LABELS[f]}
                    />
                  ))}
                </div>
              </Field>
              <div>
                <Field label="Overall objective">
                  <div
                    className={`grid gap-3 sm:grid-cols-2 ${
                      isSingleSession ? "pointer-events-none" : ""
                    }`}
                  >
                    {OBJECTIVES.map((o) => (
                      <OptionCard
                        key={o}
                        selected={!isSingleSession && a.objective === o}
                        onClick={() => set("objective", o)}
                        title={OBJECTIVE_LABELS[o]}
                        disabled={isSingleSession}
                      />
                    ))}
                  </div>
                </Field>
                {isSingleSession && (
                  <p className="mt-3 rounded-xl border border-sand-2 bg-sand/60 px-4 py-3 text-sm text-ink/70">
                    One session won’t get your team to a longer-term objective.
                    Choose a week, month, or season plan to unlock this option.
                  </p>
                )}
              </div>
            </div>
          )}

          {stepId === "strategy" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {STRATEGIES.map((s) => (
                <OptionCard
                  key={s}
                  selected={a.selectionStrategy === s}
                  onClick={() => set("selectionStrategy", s)}
                  title={STRATEGY_LABELS[s]}
                  subtitle={strategySubtitle(s)}
                />
              ))}
            </div>
          )}

          {stepId === "review" && <Review a={a} />}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full px-6 py-3 font-semibold text-ink disabled:opacity-30"
          >
            ← Back
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={generate}
              className="rounded-full bg-brand px-8 py-3 text-lg font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              Generate plan →
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setStep((s) => Math.min(s + 1, steps.length - 1))
              }
              disabled={!canContinue}
              className="rounded-full bg-ink px-8 py-3 font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
            >
              Continue →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function Review({ a }: { a: WizardAnswers }) {
  const isSingleSession = a.horizon === "session";
  const rows: [string, string][] = [
    ["Horizon", HORIZON_LABELS[a.horizon]],
    [
      "Team",
      `${AGE_LABELS[a.ageGroup]} · ${LEVEL_LABELS[a.level]} · ${a.gender}`,
    ],
    ["Roster", `${a.rosterSize} players`],
    [
      "Schedule",
      isSingleSession
        ? `${a.sessionLength} min · ${a.courts} court(s)`
        : `${a.sessionsPerWeek}×/week · ${a.sessionLength} min · ${a.courts} court(s)`,
    ],
  ];

  if (!isSingleSession && a.sessionsPerWeek <= 4 && a.practiceDays.length) {
    rows.push([
      "Practice days",
      a.practiceDays.map((d) => DAY_LABELS[d]).join(", "),
    ]);
  }

  if (GAME_DAY_HORIZONS.includes(a.horizon)) {
    rows.push([
      "Game days",
      [
        ...a.gameWeekdays.map((d) => `Every ${DAY_LABELS[d]}`),
        ...a.gameDates.map(formatDate),
      ].join(" · ") || "None set",
    ]);
  }

  rows.push(
    [
      "Equipment",
      ["balls", "net", ...a.equipment]
        .map((e) => EQUIPMENT_LABELS[e as Equipment])
        .join(", "),
    ],
    ["Focus", a.focusAreas.map((f) => FOCUS_LABELS[f]).join(", ") || "—"],
    ["Weakness", a.weakness ? FOCUS_LABELS[a.weakness] : "—"],
    [
      "Objective",
      isSingleSession
        ? "Not available for single session"
        : OBJECTIVE_LABELS[a.objective],
    ],
    ["Selection", STRATEGY_LABELS[a.selectionStrategy]]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-sand-2 bg-white">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex justify-between gap-4 px-6 py-4 ${
            i % 2 ? "bg-sand/40" : ""
          }`}
        >
          <span className="shrink-0 font-semibold text-ink/60">{k}</span>
          <span className="text-right font-medium text-ink">{v}</span>
        </div>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function horizonSubtitle(h: Horizon): string {
  switch (h) {
    case "session":
      return "One standalone practice";
    case "week":
      return "A single training week";
    case "month":
      return "≈4 weeks, phased";
    case "half-season":
      return "≈10 weeks, phased — add game days";
    case "full-season":
      return "≈20 weeks, fully periodized — add game days";
    case "playoff":
      return "≈3 weeks, taper & peak — add game days";
  }
}

function strategySubtitle(s: SelectionStrategy): string {
  switch (s) {
    case "variety":
      return "Fewest repeated drills";
    case "random":
      return "Fresh mix each time";
    case "progressive":
      return "Easier → harder over time";
  }
}
