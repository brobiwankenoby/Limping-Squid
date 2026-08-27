import type { Exercise } from "./types";

const CATEGORIES: { name: string; min: number; max: number }[] = [
  { name: "Setting", min: 1001, max: 1999 },
  { name: "Passing", min: 2001, max: 2999 },
  { name: "Attack", min: 3001, max: 3999 },
  { name: "Reception", min: 4001, max: 4999 },
  { name: "Serve", min: 5001, max: 5999 },
  { name: "Defense", min: 6001, max: 6999 },
  { name: "Block", min: 7001, max: 7999 },
  { name: "Serve and Receive", min: 10001, max: 10999 },
  { name: "Reception and Setting", min: 11001, max: 11999 },
  { name: "Setting and Attack", min: 12001, max: 12999 },
  { name: "Attack and Block", min: 13001, max: 13999 },
  { name: "Attack and Dig", min: 14001, max: 14999 },
  { name: "Structural", min: 0, max: 0 },
];

export function categoryForExercise(ex: Exercise): string {
  if (ex.sourceCode == null) return "Structural";
  for (const c of CATEGORIES) {
    if (c.min <= ex.sourceCode && ex.sourceCode <= c.max) return c.name;
  }
  return "Other";
}

export const EXERCISE_CATEGORIES = [
  "All",
  ...CATEGORIES.filter((c) => c.name !== "Structural").map((c) => c.name),
  "Structural",
];

export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
}
