import type {
  AgeGroup,
  DayOfWeek,
  Equipment,
  FocusZone,
  Horizon,
  Level,
  Objective,
  Phase,
  SelectionStrategy,
} from "./types";

export const HORIZON_LABELS: Record<Horizon, string> = {
  session: "Single session",
  week: "One week",
  month: "One month",
  "half-season": "Half season",
  "full-season": "Full season",
  playoff: "Playoff / tournament prep",
};

// Number of weeks each horizon spans (a single session is treated as 1 week / 1 session).
export const HORIZON_WEEKS: Record<Horizon, number> = {
  session: 1,
  week: 1,
  month: 4,
  "half-season": 10,
  "full-season": 20,
  playoff: 3,
};

export const AGE_LABELS: Record<AgeGroup, string> = {
  U12: "Under 12",
  U14: "Under 14",
  U16: "Under 16",
  U18: "Under 18",
  Adult: "Adult",
};

export const LEVEL_LABELS: Record<Level, string> = {
  rec: "Recreational",
  school: "School",
  club: "Club",
  elite: "Elite",
};

export const FOCUS_LABELS: Record<FocusZone, string> = {
  serving: "Serving",
  passing: "Passing / Reception",
  setting: "Setting",
  attacking: "Attacking / Hitting",
  blocking: "Blocking",
  defense: "Defense / Digging",
  "serve-receive": "Serve-receive",
  systems: "Team systems / Rotations",
  conditioning: "Conditioning",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  balls: "Volleyballs",
  net: "Net",
  cart: "Ball cart",
  targets: "Targets",
  bands: "Resistance bands",
  cones: "Cones",
  "blocking-machine": "Blocking machine",
  "service-machine": "Service machine",
  walls: "Walls",
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  fundamentals: "Build fundamentals",
  tournament: "Prep for a tournament",
  weakness: "Fix a specific weakness",
  fitness: "General fitness",
};

export const STRATEGY_LABELS: Record<SelectionStrategy, string> = {
  variety: "Maximize variety",
  random: "Random each time",
  progressive: "Progressive difficulty",
};

export const PHASE_LABELS: Record<Phase, string> = {
  prep: "Preparation",
  build: "Build",
  competition: "Competition",
  peak: "Peak / Playoffs",
  recovery: "Recovery",
};

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  prep: "Rebuild fitness and reinforce fundamentals with higher training volume.",
  build: "Develop technical skills and introduce team tactics as intensity climbs.",
  competition: "Sharpen systems and match play while maintaining skill level.",
  peak: "Taper volume, raise intensity, and lock in game-ready systems.",
  recovery: "Lighter load focused on recovery, mobility, and fun.",
};
