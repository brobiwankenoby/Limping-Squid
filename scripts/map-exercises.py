#!/usr/bin/env python3
"""
Map Georgi's media library into src/lib/exercises.ts.

Expects human-named files under category folders, e.g.:
  Setting/Setting (1001).mp4
  Attack and Dig/Attack and Dig (14025) — Footwork and defence.mp4

Skips:
  - .ts transport files
  - SSC codes 8001–8999 (add later)

Usage:
  python3 scripts/map-exercises.py
  python3 scripts/map-exercises.py --media "/path/to/Project with Georgi"
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MEDIA = Path.home() / "Documents" / "Project with Georgi"

# code range → (category, focusZones, block_type, difficulty)
CATS = [
    (1001, 1999, "Setting", ["setting"], "skill", 2),
    (2001, 2999, "Passing", ["passing"], "skill", 2),
    (3001, 3999, "Attack", ["attacking"], "skill", 3),
    (4001, 4999, "Reception", ["serve-receive"], "skill", 2),
    (5001, 5999, "Serve", ["serving"], "skill", 2),
    (6001, 6999, "Defense", ["defense"], "skill", 3),
    (7001, 7999, "Block", ["blocking"], "skill", 3),
    (10001, 10999, "Serve and Receive", ["serving", "serve-receive"], "tactical", 3),
    (11001, 11999, "Reception and Setting", ["serve-receive", "setting"], "tactical", 3),
    (12001, 12999, "Setting and Attack", ["setting", "attacking"], "tactical", 3),
    (13001, 13999, "Attack and Block", ["attacking", "blocking"], "tactical", 4),
    (14001, 14999, "Attack and Dig", ["attacking", "defense"], "tactical", 4),
    (15001, 15999, "Wall Drill", ["passing"], "skill", 1),
]

# Human name: "Setting (1001).mp4" or "Setting (1002) — Take 1.mp4"
HUMAN = re.compile(
    r"^(?P<label>.+?)\s*\((?P<code>\d+)\)(?:\s*[—\-]\s*(?P<note>.+))?\.mp4$",
    re.I,
)
# Legacy coded name: "1001.-24-07-29.mp4"
LEGACY = re.compile(r"^(\d+)")


def is_ssc(code: int) -> bool:
    return 8001 <= code <= 8999


def cat_for(code: int):
    for lo, hi, *rest in CATS:
        if lo <= code <= hi:
            return (lo, hi, *rest)
    return None


def parse_video(name: str):
    """Return (code, note_or_None, display_stem) or None."""
    m = HUMAN.match(name.strip())
    if m:
        code = int(m.group("code"))
        note = (m.group("note") or "").strip() or None
        stem = Path(name).stem
        return code, note, stem
    m = LEGACY.match(name.strip())
    if m:
        code = int(m.group(1))
        rest = name[m.end() :]
        rest = re.sub(r"^\s*\.?\s*-?\s*", "", rest)
        rest = re.sub(r"\.mp4$", "", rest, flags=re.I).strip()
        note = re.sub(r"^\d{2}-\d{2}-\d{2}\s*", "", rest).strip(" .-_") or None
        return code, note, None
    return None


def scan(media: Path) -> list[dict]:
    videos: list[str] = []
    for root, _, names in os.walk(media):
        # skip leftover Google Drive dump folders
        rel = Path(root).relative_to(media)
        if rel.parts and str(rel.parts[0]).startswith("drive-download"):
            continue
        for n in names:
            if n.lower().endswith(".mp4"):
                videos.append(os.path.join(root, n))

    exercises: list[dict] = []
    skipped_ssc = 0
    unknown: list[str] = []

    for path in sorted(videos, key=lambda p: os.path.basename(p)):
        name = os.path.basename(path)
        parsed = parse_video(name)
        if not parsed:
            unknown.append(name)
            continue
        code, note, stem = parsed
        if is_ssc(code):
            skipped_ssc += 1
            continue
        info = cat_for(code)
        if not info:
            unknown.append(name)
            continue
        _, _, cat, zones, btype, diff = info

        title = stem if stem else (f"{cat} ({code})" + (f" — {note}" if note else ""))
        desc = f"{cat} drill from the coaching library."
        if note:
            desc += f" Variant: {note}."

        equipment = ["balls", "net"]
        if 15001 <= code <= 15999:
            equipment = ["balls", "walls"]

        exercises.append(
            {
                "id": f"drill-{code}",
                "code": code,
                "sourceFile": name,
                "name": title,
                "description": desc,
                "focusZones": zones,
                "ageGroups": ["U12", "U14", "U16", "U18", "Adult"],
                "levels": ["rec", "school", "club", "elite"],
                "gender": "any",
                "difficulty": diff,
                "minPlayers": 2 if btype == "skill" else 4,
                "maxPlayers": 30,
                "durationMin": 10 if btype == "skill" else 12,
                "equipment": equipment,
                "phases": ["prep", "build", "competition", "peak", "recovery"],
                "type": btype,
                "category": cat,
            }
        )

    print(f"Mapped: {len(exercises)}  Skipped SSC: {skipped_ssc}  Unknown: {len(unknown)}")
    if unknown:
        for u in unknown[:20]:
            print(f"  unknown: {u}")
    return exercises


STRUCTURAL = r'''  // ---------- WARMUPS (structural — not from media library) ----------
  {
    id: "wu-dynamic",
    name: "Dynamic Movement Warmup",
    description:
      "Progressive jog, high knees, butt kicks, lunges, and arm circles to raise heart rate and mobilize shoulders and hips.",
    focusZones: ["conditioning"],
    ageGroups: ["U12", "U14", "U16", "U18", "Adult"],
    levels: ["rec", "school", "club", "elite"],
    gender: "any",
    difficulty: 1,
    minPlayers: 2,
    maxPlayers: 30,
    durationMin: 8,
    equipment: [],
    phases: ["prep", "build", "competition", "peak", "recovery"],
    type: "warmup",
  },
  {
    id: "wu-pepper",
    name: "Partner Pepper",
    description:
      "Pairs continuously pass, set, and controlled-hit to each other. Great ball-contact warmup that touches every core skill.",
    focusZones: ["passing", "setting", "defense"],
    ageGroups: ["U14", "U16", "U18", "Adult"],
    levels: ["school", "club", "elite"],
    gender: "any",
    difficulty: 2,
    minPlayers: 2,
    maxPlayers: 30,
    durationMin: 8,
    equipment: ["balls"],
    phases: ["prep", "build", "competition", "peak"],
    type: "warmup",
  },
  {
    id: "wu-mobility",
    name: "Band Shoulder Activation",
    description:
      "Resistance-band external rotations, pull-aparts, and scapular retractions to prime the shoulder for hitting and serving.",
    focusZones: ["conditioning"],
    ageGroups: ["U16", "U18", "Adult"],
    levels: ["club", "elite"],
    gender: "any",
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 30,
    durationMin: 6,
    equipment: ["bands"],
    phases: ["prep", "build", "competition", "peak", "recovery"],
    type: "warmup",
  },

  // ---------- SCRIMMAGE / SYSTEMS ----------
  {
    id: "sys-6v6",
    name: "Controlled 6v6 Scrimmage",
    description:
      "Full-court scrimmage with coach freezes for teaching points. Emphasize system execution over winning.",
    focusZones: ["systems", "serve-receive", "attacking"],
    ageGroups: ["U14", "U16", "U18", "Adult"],
    levels: ["school", "club", "elite"],
    gender: "any",
    difficulty: 3,
    minPlayers: 12,
    maxPlayers: 24,
    durationMin: 20,
    equipment: ["balls", "net"],
    phases: ["build", "competition", "peak"],
    type: "scrimmage",
  },
  {
    id: "sys-queen",
    name: "Queen of the Court",
    description:
      "Rotating small-sided game where winners stay on the champion side; fast-paced, competitive, fun.",
    focusZones: ["systems", "defense", "attacking"],
    ageGroups: ["U14", "U16", "U18", "Adult"],
    levels: ["school", "club", "elite"],
    gender: "any",
    difficulty: 3,
    minPlayers: 9,
    maxPlayers: 18,
    durationMin: 18,
    equipment: ["balls", "net"],
    phases: ["build", "competition", "peak", "recovery"],
    type: "scrimmage",
  },
  {
    id: "sys-mini",
    name: "Mini 3v3 Games",
    description:
      "Small-court 3v3 games maximizing touches and decision-making for developing players.",
    focusZones: ["systems", "passing", "setting"],
    ageGroups: ["U12", "U14", "U16"],
    levels: ["rec", "school"],
    gender: "any",
    difficulty: 2,
    minPlayers: 6,
    maxPlayers: 18,
    durationMin: 16,
    equipment: ["balls", "net"],
    phases: ["prep", "build", "competition", "recovery"],
    type: "scrimmage",
  },

  // ---------- CONDITIONING ----------
  {
    id: "cd-jump",
    name: "Plyometric Jump Circuit",
    description:
      "Box jumps, broad jumps, and approach jumps in timed sets to build explosive vertical power.",
    focusZones: ["conditioning"],
    ageGroups: ["U16", "U18", "Adult"],
    levels: ["club", "elite"],
    gender: "any",
    difficulty: 3,
    minPlayers: 1,
    maxPlayers: 20,
    durationMin: 12,
    equipment: ["cones"],
    phases: ["prep", "build"],
    type: "conditioning",
  },
  {
    id: "cd-agility",
    name: "Court Agility Shuttles",
    description:
      "Line-to-line shuttle sprints and defensive slides to build court speed and change of direction.",
    focusZones: ["conditioning"],
    ageGroups: ["U14", "U16", "U18", "Adult"],
    levels: ["school", "club", "elite"],
    gender: "any",
    difficulty: 2,
    minPlayers: 1,
    maxPlayers: 30,
    durationMin: 10,
    equipment: ["cones"],
    phases: ["prep", "build", "competition"],
    type: "conditioning",
  },

  // ---------- COOLDOWNS ----------
  {
    id: "cl-stretch",
    name: "Static Stretch & Debrief",
    description:
      "Full-body static stretching while the coach recaps session goals and previews the next session.",
    focusZones: ["conditioning"],
    ageGroups: ["U12", "U14", "U16", "U18", "Adult"],
    levels: ["rec", "school", "club", "elite"],
    gender: "any",
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 30,
    durationMin: 8,
    equipment: [],
    phases: ["prep", "build", "competition", "peak", "recovery"],
    type: "cooldown",
  },
  {
    id: "cl-mobility",
    name: "Foam Roll & Mobility",
    description:
      "Guided foam rolling and mobility flow targeting shoulders, hips, and ankles to aid recovery.",
    focusZones: ["conditioning"],
    ageGroups: ["U16", "U18", "Adult"],
    levels: ["club", "elite"],
    gender: "any",
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 30,
    durationMin: 8,
    equipment: ["bands"],
    phases: ["prep", "build", "competition", "peak", "recovery"],
    type: "cooldown",
  },
'''


def fmt_list(items: list) -> str:
    return "[" + ", ".join(json.dumps(x) for x in items) + "]"


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def write_ts(exercises: list[dict]) -> None:
    mapped_sorted = sorted(exercises, key=lambda e: e["code"])
    drill_blocks: list[str] = []
    current_cat = None
    for e in mapped_sorted:
        if e["category"] != current_cat:
            current_cat = e["category"]
            drill_blocks.append(
                f"\n  // ---------- {current_cat.upper()} (codes from media library) ----------"
            )
        lines = [
            "  {",
            f'    id: "{e["id"]}",',
            f'    sourceCode: {e["code"]},',
            f'    sourceFile: "{esc(e["sourceFile"])}",',
            f'    name: "{esc(e["name"])}",',
            f'    description: "{esc(e["description"])}",',
            f'    focusZones: {fmt_list(e["focusZones"])},',
            f'    ageGroups: {fmt_list(e["ageGroups"])},',
            f'    levels: {fmt_list(e["levels"])},',
            f'    gender: "{e["gender"]}",',
            f'    difficulty: {e["difficulty"]},',
            f'    minPlayers: {e["minPlayers"]},',
            f'    maxPlayers: {e["maxPlayers"]},',
            f'    durationMin: {e["durationMin"]},',
            f'    equipment: {fmt_list(e["equipment"])},',
            f'    phases: {fmt_list(e["phases"])},',
            f'    type: "{e["type"]}",',
            "    // videoUrl: add YouTube unlisted URL when uploaded",
            "  },",
        ]
        drill_blocks.append("\n".join(lines))

    header = '''import type { Exercise } from "./types";

/**
 * Exercise library for Limping Squid.
 *
 * - Warmup / cooldown / scrimmage / conditioning: structural stubs the
 *   session builder needs (not yet in Georgi's coded media library).
 * - Skill / tactical drills: mapped from local .mp4 filenames by code range.
 *   SSC (8001–8999) and .ts files are deferred. Wall drills (15001+) none yet.
 * - videoUrl is empty until clips are uploaded to YouTube (unlisted).
 * - Regenerate mapped portion via: scripts/map-exercises.py
 */
export const EXERCISES: Exercise[] = [
'''
    out = header + STRUCTURAL + "\n".join(drill_blocks) + "\n];\n"
    (ROOT / "src/lib/exercises.ts").write_text(out, encoding="utf-8")
    (ROOT / "scripts/mapped-exercises.json").write_text(
        json.dumps(mapped_sorted, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote src/lib/exercises.ts ({len(mapped_sorted)} drills + structural)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--media", type=Path, default=DEFAULT_MEDIA)
    args = ap.parse_args()
    if not args.media.exists():
        raise SystemExit(f"Media folder not found: {args.media}")
    write_ts(scan(args.media))


if __name__ == "__main__":
    main()
