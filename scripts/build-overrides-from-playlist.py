#!/usr/bin/env python3
"""Build data/exercise-overrides.json from scraped playlist + mapped library."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAYLIST = "https://www.youtube.com/playlist?list=PLOwiS96arVl0"
CODE_RE = re.compile(r"(\d{4,5})\b")


def main() -> None:
    raw = subprocess.check_output(
        ["yt-dlp", "--flat-playlist", "--print", "%(id)s\t%(title)s", PLAYLIST],
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    code_to_url: dict[int, str] = {}
    for line in raw.strip().splitlines():
        if not line.strip():
            continue
        vid, title = line.split("\t", 1)
        m = CODE_RE.search(title)
        if not m:
            continue
        code = int(m.group(1))
        if code not in code_to_url:
            code_to_url[code] = f"https://www.youtube.com/watch?v={vid}"

    with open(ROOT / "scripts" / "mapped-exercises.json", encoding="utf-8") as f:
        drills = json.load(f)

    overrides: dict[str, dict] = {}
    for d in drills:
        code = d["code"]
        if code not in code_to_url:
            continue
        overrides[d["id"]] = {"videoUrl": code_to_url[code]}

    out = ROOT / "data" / "exercise-overrides.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(overrides, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(overrides)} overrides to {out}")


if __name__ == "__main__":
    main()
