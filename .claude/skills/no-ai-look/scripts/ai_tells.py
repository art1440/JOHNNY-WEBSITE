#!/usr/bin/env python3
"""Scan HTML/CSS/JS/JSX files for the mechanical tells of an AI-generated website.

Usage:  python3 ai_tells.py index.html styles.css src/components/*.tsx

Findings are prompts to make a decision, not errors: each one is fine if the chosen
visual world calls for it. Exit code is always 0.
"""
import re
import sys
from pathlib import Path

DEFAULT_FONTS = [
    "Inter", "Fraunces", "Playfair Display", "DM Sans", "DM Serif", "Space Grotesk", "Plus Jakarta Sans",
    "Outfit", "Instrument Serif", "Instrument Sans", "Cormorant", "Lora", "Syne", "IBM Plex", "Poppins",
    "Montserrat", "Manrope", "Newsreader", "Crimson",
]
# Tailwind's default accent hexes; they show up when a palette was never chosen
DEFAULT_HEX = ["#6366f1", "#8b5cf6", "#a855f7", "#7c3aed", "#3b82f6", "#06b6d4", "#22d3ee", "#ec4899", "#10b981"]

font_re = re.compile(
    r"(?:font-family\s*:[^;}{]*|(?<![\w-])font\s*:[^;}{]*|family=|fontFamily[^,\n]*)("+ "|".join(re.escape(f).replace(r"\ ", r"[ +]") for f in DEFAULT_FONTS) + r")\b",
    re.I,
)

CHECKS = [
    # (regex, label, why)
    (re.compile(r"backdrop-filter\s*:\s*blur|backdrop-blur", re.I),
     "glass card", "frosted glass is the default 'premium' surface; is there a physical reason for glass here?"),
    (re.compile(r"background-clip\s*:\s*text|bg-clip-text", re.I),
     "gradient text", "emphasis via gradient-filled text reads as template; use weight, size or the world's own lettering"),
    (re.compile(r"conic-gradient\([^)]*from\s+var\(", re.I),
     "spinning glow border", "animated conic border sheen is a stock 'AI card' effect"),
    (re.compile(r"@keyframes\s+[\w-]*grain|animation\s*:[^;]*grain", re.I),
     "animated grain", "film-grain overlays animating over everything are a default texture"),
    (re.compile(r"class(Name)?\s*=\s*[\"'][^\"']*\b(eyebrow|kicker|overline|pre-?title)\b", re.I),
     "eyebrow label", "small uppercase label above a heading; let the heading carry itself"),
    (re.compile(r"\b(only \d+ (left|spots?)|people are (viewing|looking)|just (signed up|purchased|booked)|offer ends in|countdown)\b", re.I),
     "fake urgency / social proof", "invented urgency and toasts erode trust; use only real, labeled proof"),
    (re.compile(r"(?<![\w-])(elevate|unlock|seamless(ly)?|supercharge|revolutioni[sz]e|next-level|game-?changer|empower)\b", re.I),
     "stock copy", "generic marketing verbs; say what the product does in the audience's words"),
    (re.compile(r"[←-⇿✓✔✨]|[\U0001F300-\U0001FAFF]"),
     "glyph or emoji as icon", "arrows, check marks, sparkles or emoji standing in for an icon system; draw real SVG icons"),
]

orb_re = re.compile(r"filter\s*:\s*blur\(\s*(\d+(?:\.\d+)?)px", re.I)
card_re = re.compile(r"class(?:Name)?\s*=\s*[\"'][^\"']*\b((?:feature|benefit|service|pricing|stat|info)-?card|card)\b", re.I)
anim_re = re.compile(r"@keyframes|animation\s*:|transition\s*:|\.animate\(", re.I)
reduced_re = re.compile(r"prefers-reduced-motion", re.I)


def scan(path: Path):
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    out = []
    for n, line in enumerate(lines, 1):
        for m in font_re.finditer(line):
            out.append((n, "default font", f"'{m.group(1)}' is a training-data default; pick a face with a story that fits the world"))
        for rx, label, why in CHECKS:
            if rx.search(line):
                out.append((n, label, why))
        for m in orb_re.finditer(line):
            if float(m.group(1)) >= 40:
                out.append((n, "blurred gradient orb", f"blur({m.group(1)}px) blobs drifting behind content are the classic AI hero backdrop"))
        low = line.lower()
        for h in DEFAULT_HEX:
            if h in low:
                out.append((n, "default palette color", f"{h} is a framework default accent; was this color chosen from the world?"))
    cards = card_re.findall(text)
    if len(cards) >= 3:
        out.append((0, "repeated card grid", f"{len(cards)} elements use a generic *card class; are identical cards really the right structure?"))
    if anim_re.search(text) and path.suffix.lower() in {".css", ".scss", ".html", ".vue", ".svelte"} and not reduced_re.search(text):
        out.append((0, "no reduced-motion path", "animations found but no prefers-reduced-motion handling in this file"))
    return out


def main(argv):
    if not argv:
        print(__doc__)
        return 0
    total = 0
    for arg in argv:
        p = Path(arg)
        if not p.is_file():
            print(f"skip {arg} (not a file)")
            continue
        found = scan(p)
        total += len(found)
        if not found:
            print(f"{p}: no mechanical tells found (still do the category guess test)")
            continue
        print(f"{p}: {len(found)} possible tell(s)")
        for n, label, why in found:
            where = f"line {n}" if n else "file"
            print(f"  - {where}: {label}: {why}")
    print(f"\n{total} finding(s). Each is a question: keep it only if your chosen world calls for it.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
