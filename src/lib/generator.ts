import { EXERCISES } from "./exercises";
import {
  DAY_LABELS,
  FOCUS_LABELS,
  HORIZON_WEEKS,
  PHASE_DESCRIPTIONS,
  PHASE_LABELS,
} from "./labels";
import type {
  AgeGroup,
  Block,
  BlockType,
  DayOfWeek,
  Exercise,
  FocusZone,
  Level,
  LoadLevel,
  Phase,
  PhaseBlock,
  PlannedExercise,
  Session,
  TrainingPlan,
  Week,
  WizardAnswers,
} from "./types";
import { DAYS_OF_WEEK, GAME_DAY_HORIZONS } from "./types";

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${idCounter++}`;

const DAY_INDEX: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/** Supporting skill that naturally pairs with a primary theme. */
const SECONDARY_FOR: Record<FocusZone, FocusZone> = {
  serving: "serve-receive",
  passing: "setting",
  setting: "attacking",
  attacking: "setting",
  blocking: "defense",
  defense: "systems",
  "serve-receive": "serving",
  systems: "serve-receive",
  conditioning: "defense",
};

function makeRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function phaseTemplate(
  horizon: WizardAnswers["horizon"]
): { phase: Phase; weeks: number }[] {
  switch (horizon) {
    case "session":
    case "week":
      return [{ phase: "build", weeks: 1 }];
    case "month":
      return [
        { phase: "prep", weeks: 1 },
        { phase: "build", weeks: 2 },
        { phase: "competition", weeks: 1 },
      ];
    case "half-season":
      return [
        { phase: "prep", weeks: 3 },
        { phase: "build", weeks: 3 },
        { phase: "competition", weeks: 3 },
        { phase: "peak", weeks: 1 },
      ];
    case "full-season":
      return [
        { phase: "prep", weeks: 5 },
        { phase: "build", weeks: 7 },
        { phase: "competition", weeks: 5 },
        { phase: "peak", weeks: 2 },
        { phase: "recovery", weeks: 1 },
      ];
    case "playoff":
      return [
        { phase: "competition", weeks: 1 },
        { phase: "peak", weeks: 2 },
      ];
  }
}

const PHASE_DEFAULT_FOCUS: Record<Phase, FocusZone[]> = {
  prep: ["conditioning", "passing", "serving", "defense"],
  build: ["attacking", "setting", "blocking", "passing"],
  competition: ["systems", "serve-receive", "attacking", "defense"],
  peak: ["systems", "serving", "serve-receive"],
  recovery: ["defense", "setting", "conditioning"],
};

const PHASE_LOAD: Record<Phase, LoadLevel> = {
  prep: "high",
  build: "high",
  competition: "moderate",
  peak: "low",
  recovery: "low",
};

function weekEmphasis(
  answers: WizardAnswers,
  phase: Phase
): { zone: FocusZone; weight: number }[] {
  const weights = new Map<FocusZone, number>();
  const add = (zone: FocusZone, w: number) =>
    weights.set(zone, (weights.get(zone) ?? 0) + w);

  answers.focusAreas.forEach((z) => add(z, 3));
  if (answers.weakness) add(answers.weakness, 3);
  // Single-session plans skip season objectives — one practice can't deliver them.
  if (answers.horizon !== "session") {
    if (answers.objective === "fitness") add("conditioning", 3);
    if (answers.objective === "tournament") add("systems", 2);
  }
  PHASE_DEFAULT_FOCUS[phase].forEach((z) => add(z, 1));

  return [...weights.entries()]
    .map(([zone, weight]) => ({ zone, weight }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Rotate primary themes across sessions in a week.
 * Weakness gets an extra slot when present.
 */
function rotateThemes(
  emphasis: { zone: FocusZone; weight: number }[],
  sessionCount: number,
  weakness?: FocusZone
): FocusZone[] {
  const pool = emphasis.map((e) => e.zone);
  if (weakness && !pool.includes(weakness)) pool.unshift(weakness);

  // Prefer coach focus areas first (already sorted by weight).
  const themes: FocusZone[] = [];
  if (pool.length === 0) {
    return Array.from({ length: sessionCount }, () => "passing" as FocusZone);
  }

  // Build a rotation list: weakness twice if present, then top zones.
  const rotation: FocusZone[] = [];
  if (weakness) rotation.push(weakness);
  for (const z of pool) {
    if (!rotation.includes(z)) rotation.push(z);
  }
  // Extra weakness slot mid-week when we have 3+ sessions.
  if (weakness && sessionCount >= 3 && rotation[0] === weakness) {
    rotation.splice(Math.min(2, rotation.length), 0, weakness);
  }

  for (let i = 0; i < sessionCount; i++) {
    themes.push(rotation[i % rotation.length]);
  }
  return themes;
}

function secondaryFor(theme: FocusZone): FocusZone {
  return SECONDARY_FOR[theme];
}

/** Hybrid: more game-like for older/competitive; more technical for young/prep/low. */
function gameLikeBias(
  answers: WizardAnswers,
  phase: Phase,
  intensity: LoadLevel
): number {
  // 0 = more technical primary, 1 = more game-like
  let bias = 0.45;

  const ageBoost: Record<AgeGroup, number> = {
    U12: -0.15,
    U14: -0.1,
    U16: 0,
    U18: 0.08,
    Adult: 0.1,
  };
  const levelBoost: Record<Level, number> = {
    rec: -0.12,
    school: -0.05,
    club: 0.05,
    elite: 0.12,
  };
  bias += ageBoost[answers.ageGroup] + levelBoost[answers.level];

  if (phase === "prep" || phase === "recovery") bias -= 0.1;
  if (phase === "competition" || phase === "peak") bias += 0.12;
  if (intensity === "low") bias -= 0.15;
  if (intensity === "high") bias += 0.08;

  return Math.max(0.2, Math.min(0.75, bias));
}

interface FilterCtx {
  answers: WizardAnswers;
  phase: Phase;
}

function matches(
  ex: Exercise,
  ctx: FilterCtx,
  opts: { usePhase: boolean; useRoster: boolean }
): boolean {
  const { answers } = ctx;
  if (!ex.ageGroups.includes(answers.ageGroup)) return false;
  if (!ex.levels.includes(answers.level)) return false;
  if (
    answers.gender !== "mixed" &&
    ex.gender !== "any" &&
    ex.gender !== answers.gender
  )
    return false;

  const available = new Set(["balls", "net", ...answers.equipment]);
  if (!ex.equipment.every((e) => available.has(e))) return false;

  if (
    opts.useRoster &&
    (answers.rosterSize < ex.minPlayers || answers.rosterSize > ex.maxPlayers)
  )
    return false;

  if (opts.usePhase && !ex.phases.includes(ctx.phase)) return false;

  return true;
}

function poolFor(
  type: BlockType[],
  zones: FocusZone[] | null,
  ctx: FilterCtx
): Exercise[] {
  const byType = (ex: Exercise) => type.includes(ex.type);
  const byZone = (ex: Exercise) =>
    zones ? ex.focusZones.some((z) => zones.includes(z)) : true;

  for (const opts of [
    { usePhase: true, useRoster: true },
    { usePhase: false, useRoster: true },
    { usePhase: false, useRoster: false },
  ]) {
    const pool = EXERCISES.filter(
      (ex) => byType(ex) && byZone(ex) && matches(ex, ctx, opts)
    );
    if (pool.length) return pool;
  }
  return EXERCISES.filter((ex) => byType(ex));
}

/** Prefer warm-ups that involve a ball when available. */
function warmupPool(ctx: FilterCtx): Exercise[] {
  const all = poolFor(["warmup"], null, ctx);
  const withBall = all.filter((ex) => ex.equipment.includes("balls"));
  return withBall.length ? withBall : all;
}

interface PickCtx extends FilterCtx {
  used: Set<string>;
  strategy: WizardAnswers["selectionStrategy"];
  progress: number;
  rng: () => number;
}

function orderPool(pool: Exercise[], ctx: PickCtx): Exercise[] {
  if (ctx.strategy === "random") return shuffle(pool, ctx.rng);
  if (ctx.strategy === "progressive") {
    const target = 1 + ctx.progress * 4;
    return [...pool].sort(
      (a, b) =>
        Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target)
    );
  }
  return shuffle(pool, ctx.rng).sort((a, b) => {
    const au = ctx.used.has(a.id) ? 1 : 0;
    const bu = ctx.used.has(b.id) ? 1 : 0;
    return au - bu;
  });
}

function fillBlock(
  type: BlockType,
  title: string,
  pool: Exercise[],
  targetMin: number,
  ctx: PickCtx,
  maxItems = 4,
  minChunk = 5
): Block {
  const items: PlannedExercise[] = [];
  let used = 0;
  const budget = Math.max(0, targetMin);
  const ordered = orderPool(pool, ctx);

  for (const ex of ordered) {
    if (items.length >= maxItems) break;
    const remaining = budget - used;
    if (remaining < minChunk) break;
    if (items.some((i) => i.exercise.id === ex.id)) continue;

    const duration = Math.min(ex.durationMin, remaining);
    if (duration < minChunk) continue;

    items.push({ exercise: ex, durationMin: duration });
    used += duration;
    ctx.used.add(ex.id);
  }

  if (items.length === 0 && ordered.length && budget >= minChunk) {
    const ex = ordered[0];
    items.push({
      exercise: ex,
      durationMin: Math.min(ex.durationMin, budget),
    });
    ctx.used.add(ex.id);
  }

  return { id: uid("block"), type, title, items };
}

function blockMinutes(block: Block): number {
  return block.items.reduce((s, i) => s + i.durationMin, 0);
}

function enforceSessionCap(blocks: Block[], sessionLength: number): Block[] {
  let total = blocks.reduce((s, b) => s + blockMinutes(b), 0);
  if (total <= sessionLength) return blocks;

  const trimOrder = [
    "conditioning",
    "skill",
    "scrimmage",
    "tactical",
    "warmup",
    "cooldown",
  ];
  const result = blocks.map((b) => ({
    ...b,
    items: b.items.map((i) => ({ ...i })),
  }));

  for (const type of trimOrder) {
    if (total <= sessionLength) break;
    for (let bi = result.length - 1; bi >= 0; bi--) {
      if (result[bi].type !== type) continue;
      for (let ii = result[bi].items.length - 1; ii >= 0; ii--) {
        if (total <= sessionLength) break;
        const item = result[bi].items[ii];
        const overflow = total - sessionLength;
        if (item.durationMin <= overflow) {
          total -= item.durationMin;
          result[bi].items.splice(ii, 1);
        } else {
          item.durationMin -= overflow;
          total -= overflow;
        }
      }
    }
  }

  return result.filter((b) => b.items.length > 0);
}

function sortedPracticeDays(answers: WizardAnswers): DayOfWeek[] | null {
  if (answers.horizon === "session") return null;
  if (answers.sessionsPerWeek > 4) return null;
  if (!answers.practiceDays?.length) return null;
  return [...answers.practiceDays].sort(
    (a, b) => DAY_INDEX[a] - DAY_INDEX[b]
  );
}

function usesGameDays(answers: WizardAnswers): boolean {
  return GAME_DAY_HORIZONS.includes(answers.horizon);
}

function dateForWeekDay(
  startDate: string | undefined,
  weekIndex: number,
  day: DayOfWeek
): string | null {
  if (!startDate) return null;
  const start = new Date(startDate + "T12:00:00");
  if (Number.isNaN(start.getTime())) return null;
  const jsDay = start.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(start);
  monday.setDate(
    start.getDate() + mondayOffset + (weekIndex - 1) * 7 + DAY_INDEX[day]
  );
  return monday.toISOString().slice(0, 10);
}

function isGameOnDay(
  answers: WizardAnswers,
  weekIndex: number,
  day: DayOfWeek
): boolean {
  if (!usesGameDays(answers)) return false;
  if (answers.gameWeekdays.includes(day)) return true;
  const iso = dateForWeekDay(answers.startDate, weekIndex, day);
  return iso ? answers.gameDates.includes(iso) : false;
}

function nextDay(day: DayOfWeek): DayOfWeek {
  return DAYS_OF_WEEK[(DAY_INDEX[day] + 1) % 7];
}

function prevDay(day: DayOfWeek): DayOfWeek {
  return DAYS_OF_WEEK[(DAY_INDEX[day] + 6) % 7];
}

function assignIntensities(
  days: DayOfWeek[],
  weekIndex: number,
  phaseLoad: LoadLevel,
  answers: WizardAnswers
): { intensity: LoadLevel; note?: string }[] {
  const result: { intensity: LoadLevel; note?: string }[] = [];
  let prevHigh = false;
  let consecutiveHard = 0;

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const gameTomorrow = isGameOnDay(answers, weekIndex, nextDay(day));
    const gameToday = isGameOnDay(answers, weekIndex, day);
    const gameYesterday = isGameOnDay(answers, weekIndex, prevDay(day));

    const prevPractice = i > 0 ? days[i - 1] : null;
    const consecutivePractice =
      prevPractice !== null &&
      DAY_INDEX[day] - DAY_INDEX[prevPractice] === 1;

    let intensity: LoadLevel = phaseLoad;
    let note: string | undefined;

    if (gameToday) {
      intensity = "low";
      note = "Game day — activation / light technical only";
    } else if (gameTomorrow) {
      intensity = "low";
      note = "MD-1 — technical sharpness, low jump volume";
    } else if (gameYesterday) {
      intensity = "low";
      note = "MD+1 — recovery-oriented ball work";
    } else if (consecutivePractice && (prevHigh || consecutiveHard >= 1)) {
      intensity = "low";
      note = "Easing load — avoiding three hard days in a row";
      consecutiveHard = 0;
      prevHigh = false;
    } else if (consecutivePractice) {
      intensity = phaseLoad === "high" ? "moderate" : phaseLoad;
      note = "Softened — consecutive practice day";
      consecutiveHard = 0;
      prevHigh = false;
    } else {
      intensity = phaseLoad;
      consecutiveHard = intensity === "high" ? 1 : 0;
      prevHigh = intensity === "high";
    }

    if (intensity === "high" && consecutiveHard >= 3) {
      intensity = "moderate";
      note = "Load capped — avoiding three hard days in a row";
      consecutiveHard = 0;
      prevHigh = false;
    }

    result.push({ intensity, note });
  }

  return result;
}

/**
 * Allocate minutes across the five research-backed blocks.
 * Shares always sum to sessionLength.
 */
function allocateBudget(
  sessionLength: number,
  answers: WizardAnswers,
  phase: Phase,
  intensity: LoadLevel
): {
  warmup: number;
  primary: number;
  secondary: number;
  conditioning: number;
  gamelike: number;
  closeout: number;
} {
  const L = Math.max(30, sessionLength);
  const bias = gameLikeBias(answers, phase, intensity);

  const wantConditioning =
    answers.horizon !== "session" &&
    (phase === "prep" || answers.objective === "fitness") &&
    intensity !== "low";

  // Fixed bookends as % of L, clamped.
  let warmup = Math.round(clamp(L * 0.11, 6, 12));
  let closeout = Math.round(clamp(L * (intensity === "low" ? 0.14 : 0.15), 8, 18));

  let remaining = L - warmup - closeout;
  let conditioning = 0;
  if (wantConditioning) {
    conditioning = Math.round(remaining * 0.1);
    remaining -= conditioning;
  }

  // Split remaining between primary / secondary / game-like using bias.
  // Higher bias → more game-like, less isolated primary.
  const primaryShare = 0.5 - bias * 0.25; // ~0.31–0.45 of middle
  const gamelikeShare = 0.25 + bias * 0.3; // ~0.31–0.475 of middle
  const secondaryShare = 1 - primaryShare - gamelikeShare;

  let primary = Math.round(remaining * primaryShare);
  let gamelike = Math.round(remaining * gamelikeShare);
  let secondary = remaining - primary - gamelike;

  // Low intensity: shrink game-like, grow primary/secondary technical.
  if (intensity === "low") {
    const shift = Math.round(gamelike * 0.45);
    gamelike -= shift;
    primary += Math.round(shift * 0.6);
    secondary += shift - Math.round(shift * 0.6);
  }

  // Ensure minimums when possible.
  if (secondary < 8 && remaining >= 24) {
    const need = 8 - secondary;
    if (primary > need + 10) {
      primary -= need;
      secondary += need;
    }
  }
  if (gamelike < 8 && intensity !== "low" && remaining >= 30) {
    const need = 8 - gamelike;
    if (primary > need + 12) {
      primary -= need;
      gamelike += need;
    }
  }

  // Reconcile rounding drift.
  const sum =
    warmup + primary + secondary + conditioning + gamelike + closeout;
  if (sum !== L) {
    primary += L - sum;
  }

  return { warmup, primary, secondary, conditioning, gamelike, closeout };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildSession(
  index: number,
  label: string,
  answers: WizardAnswers,
  phase: Phase,
  theme: FocusZone,
  ctx: Omit<PickCtx, "phase">,
  opts: {
    day?: DayOfWeek;
    intensity: LoadLevel;
    note?: string;
  }
): Session {
  const pickCtx: PickCtx = { ...ctx, answers, phase };
  const secondary = secondaryFor(theme);
  const sessionLength = Math.max(30, answers.sessionLength);
  const budget = allocateBudget(
    sessionLength,
    answers,
    phase,
    opts.intensity
  );

  const blocks: Block[] = [];

  // 1. Ball warm-up
  blocks.push(
    fillBlock(
      "warmup",
      "Warm-up (ball)",
      warmupPool(pickCtx),
      budget.warmup,
      pickCtx,
      2
    )
  );

  // 2. Optional conditioning (prep / fitness only, not on low days)
  if (budget.conditioning >= 8) {
    blocks.push(
      fillBlock(
        "conditioning",
        "Conditioning",
        poolFor(["conditioning"], ["conditioning"], pickCtx),
        budget.conditioning,
        pickCtx,
        2
      )
    );
  }

  // 3. Primary theme
  blocks.push(
    fillBlock(
      "skill",
      `Primary: ${FOCUS_LABELS[theme]}`,
      poolFor(["skill", "tactical"], [theme], pickCtx),
      budget.primary,
      pickCtx,
      2
    )
  );

  // 4. Secondary linked skill
  blocks.push(
    fillBlock(
      "skill",
      `Secondary: ${FOCUS_LABELS[secondary]}`,
      poolFor(["skill", "tactical"], [secondary], pickCtx),
      budget.secondary,
      pickCtx,
      2
    )
  );

  // 5. Game-like constrained play (prefer drills tagged with the theme)
  if (budget.gamelike >= 6) {
    const themedGame = poolFor(["scrimmage", "tactical"], [theme], pickCtx);
    const anyGame = poolFor(["scrimmage", "tactical"], null, pickCtx);
    blocks.push(
      fillBlock(
        "scrimmage",
        `Game-like: ${FOCUS_LABELS[theme]}`,
        themedGame.length ? themedGame : anyGame,
        budget.gamelike,
        pickCtx,
        2
      )
    );
  }

  // 6. Closeout — scrimmage finish on harder days; cooldown recap always
  const closeoutScrimmage =
    opts.intensity !== "low" && budget.closeout >= 14
      ? Math.round(budget.closeout * 0.55)
      : 0;
  const cooldownMin = budget.closeout - closeoutScrimmage;

  if (closeoutScrimmage >= 8) {
    blocks.push(
      fillBlock(
        "scrimmage",
        "Closeout scrimmage",
        poolFor(["scrimmage"], null, pickCtx),
        closeoutScrimmage,
        pickCtx,
        1
      )
    );
  }

  blocks.push(
    fillBlock(
      "cooldown",
      "Cool-down + recap",
      poolFor(["cooldown"], null, pickCtx),
      Math.max(5, cooldownMin),
      pickCtx,
      1
    )
  );

  const capped = enforceSessionCap(blocks, sessionLength);
  const totalMin = capped.reduce((s, b) => s + blockMinutes(b), 0);

  return {
    id: uid("session"),
    index,
    label,
    day: opts.day,
    theme,
    secondaryTheme: secondary,
    intensity: opts.intensity,
    note: opts.note,
    focus: [theme, secondary],
    blocks: capped,
    totalMin,
  };
}

export function generatePlan(answers: WizardAnswers): TrainingPlan {
  idCounter = 0;
  const rng = makeRng(Date.now() % 2147483647);
  const template = phaseTemplate(answers.horizon);
  const totalWeeks = HORIZON_WEEKS[answers.horizon];

  const practiceDays = sortedPracticeDays(answers);
  const sessionsPerWeek =
    answers.horizon === "session"
      ? 1
      : practiceDays
        ? practiceDays.length
        : answers.sessionsPerWeek;

  const totalSessions = Math.max(1, totalWeeks * sessionsPerWeek);
  const used = new Set<string>();
  let sessionCounter = 0;

  const phases: PhaseBlock[] = [];
  let weekCursor = 1;

  for (const { phase, weeks } of template) {
    const weekStart = weekCursor;
    const weekEnd = weekCursor + weeks - 1;
    const weekBlocks: Week[] = [];

    for (let w = 0; w < weeks; w++) {
      const weekIndex = weekCursor + w;
      const emphasis = weekEmphasis(answers, phase);
      const sessions: Session[] = [];

      const days: (DayOfWeek | undefined)[] = practiceDays
        ? practiceDays
        : Array.from({ length: sessionsPerWeek }, () => undefined);

      const themes = rotateThemes(
        emphasis,
        days.length,
        answers.weakness
      );

      const intensityPlan = practiceDays
        ? assignIntensities(
            practiceDays,
            weekIndex,
            PHASE_LOAD[phase],
            answers
          )
        : days.map(() => ({
            intensity: PHASE_LOAD[phase] as LoadLevel,
            note: undefined as string | undefined,
          }));

      for (let s = 0; s < days.length; s++) {
        const progress =
          totalSessions <= 1 ? 0 : sessionCounter / (totalSessions - 1);
        const day = days[s];
        const theme = themes[s];
        const { intensity, note } = intensityPlan[s];

        const dayPart =
          answers.horizon === "session"
            ? "Session"
            : day
              ? DAY_LABELS[day]
              : `Session ${s + 1}`;
        const label = `${dayPart} — ${FOCUS_LABELS[theme]}`;

        sessions.push(
          buildSession(
            sessionCounter,
            label,
            answers,
            phase,
            theme,
            {
              answers,
              used,
              strategy: answers.selectionStrategy,
              progress,
              rng,
            },
            { day, intensity, note }
          )
        );
        sessionCounter++;
      }

      weekBlocks.push({
        id: uid("week"),
        index: weekIndex,
        emphasis: emphasis.slice(0, 3).map((e) => e.zone),
        load: PHASE_LOAD[phase],
        sessions,
      });
    }

    phases.push({
      id: uid("phase"),
      phase,
      name: PHASE_LABELS[phase],
      description: PHASE_DESCRIPTIONS[phase],
      weekStart,
      weekEnd,
      weeks: weekBlocks,
    });

    weekCursor += weeks;
  }

  return {
    id: uid("plan"),
    title: buildTitle(answers),
    horizon: answers.horizon,
    totalWeeks,
    answers,
    phases,
  };
}

function buildTitle(answers: WizardAnswers): string {
  const focus =
    answers.focusAreas.length > 0
      ? answers.focusAreas.join(", ")
      : "all-around";
  return `${answers.ageGroup} ${answers.level} — ${focus} plan`;
}

export function alternativesFor(
  ex: Exercise,
  answers: WizardAnswers,
  phase: Phase
): Exercise[] {
  const ctx: FilterCtx = { answers, phase };
  return poolFor([ex.type], ex.focusZones, ctx).filter((e) => e.id !== ex.id);
}

export function defaultPracticeDays(n: number): DayOfWeek[] {
  switch (n) {
    case 1:
      return ["wednesday"];
    case 2:
      return ["tuesday", "thursday"];
    case 3:
      return ["monday", "wednesday", "friday"];
    case 4:
      return ["monday", "tuesday", "thursday", "friday"];
    default:
      return [];
  }
}
