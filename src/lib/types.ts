// Core domain types for the Limping Squid training-plan prototype.

export type FocusZone =
  | "serving"
  | "passing"
  | "setting"
  | "attacking"
  | "blocking"
  | "defense"
  | "serve-receive"
  | "systems"
  | "conditioning";

export type AgeGroup = "U12" | "U14" | "U16" | "U18" | "Adult";

export type Level = "rec" | "school" | "club" | "elite";

export type Gender = "men" | "women" | "any";

export type Equipment =
  | "balls"
  | "net"
  | "cart"
  | "targets"
  | "bands"
  | "cones"
  | "blocking-machine"
  | "service-machine"
  | "walls";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Season phases used by the periodization engine.
export type Phase = "prep" | "build" | "competition" | "peak" | "recovery";

// Which block of a session an exercise belongs to.
export type BlockType =
  | "warmup"
  | "skill"
  | "tactical"
  | "scrimmage"
  | "conditioning"
  | "cooldown";

export type LoadLevel = "low" | "moderate" | "high";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  focusZones: FocusZone[];
  ageGroups: AgeGroup[];
  levels: Level[];
  gender: Gender;
  difficulty: 1 | 2 | 3 | 4 | 5;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  equipment: Equipment[];
  phases: Phase[];
  type: BlockType;
  videoUrl?: string;
}

// ---- Wizard answers ----

export type Horizon =
  | "session"
  | "week"
  | "month"
  | "half-season"
  | "full-season"
  | "playoff";

export type Objective =
  | "fundamentals"
  | "tournament"
  | "weakness"
  | "fitness";

export type SelectionStrategy = "variety" | "random" | "progressive";

export interface WizardAnswers {
  horizon: Horizon;
  ageGroup: AgeGroup;
  level: Level;
  rosterSize: number;
  gender: "men" | "women" | "mixed";
  startDate?: string;
  sessionsPerWeek: number;
  /** Custom practice length in minutes — plans must not exceed this. */
  sessionLength: number;
  courts: number;
  equipment: Equipment[];
  /** Required when sessionsPerWeek <= 4. Exact practice weekdays. */
  practiceDays: DayOfWeek[];
  /** Recurring weekly game days (half/full season + playoff). */
  gameWeekdays: DayOfWeek[];
  /** One-off game dates as YYYY-MM-DD (half/full season + playoff). */
  gameDates: string[];
  focusAreas: FocusZone[];
  weakness?: FocusZone;
  objective: Objective;
  selectionStrategy: SelectionStrategy;
}

// ---- Generated plan structures ----

export interface PlannedExercise {
  exercise: Exercise;
  durationMin: number;
}

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  items: PlannedExercise[];
}

export interface Session {
  id: string;
  index: number;
  label: string;
  day?: DayOfWeek;
  /** Primary practice theme for this session. */
  theme: FocusZone;
  /** Supporting skill linked to the primary theme. */
  secondaryTheme: FocusZone;
  intensity: LoadLevel;
  note?: string;
  focus: FocusZone[];
  blocks: Block[];
  totalMin: number;
}

export interface Week {
  id: string;
  index: number;
  emphasis: FocusZone[];
  load: LoadLevel;
  sessions: Session[];
}

export interface PhaseBlock {
  id: string;
  phase: Phase;
  name: string;
  description: string;
  weekStart: number;
  weekEnd: number;
  weeks: Week[];
}

export interface TrainingPlan {
  id: string;
  title: string;
  horizon: Horizon;
  totalWeeks: number;
  answers: WizardAnswers;
  phases: PhaseBlock[];
}

/** Horizons that support game-day personalization. */
export const GAME_DAY_HORIZONS: Horizon[] = [
  "half-season",
  "full-season",
  "playoff",
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
