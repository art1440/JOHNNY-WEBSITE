---
name: no-ai-look
description: Keeps websites from looking AI-generated. Use this whenever you build, redesign, restyle, theme, or review any website, landing page, homepage, portfolio, web app screen, HTML/CSS page or UI component, even if the user never mentions "AI" or style, and especially when they say a page looks generic, templated, boring, "like every other site" or "AI made". It replaces the default look (Inter/Fraunces, glass cards, blurry gradient blobs, cream + serif + terracotta, icon-card grids, eyebrow labels, gradient text) with a visual world taken from the audience's own life, plus purposeful, authored motion.
---

# No AI look

People can now spot an AI-made website in about a second, and when they do they trust it less. For a business
that sells on trust (an agent, a clinic, a local shop) looking generated costs sales. This skill exists because a
real client rejected a first draft with "it looks a lot like AI made". The fix was not polishing; it was choosing
a world. Use what follows before writing any visual code, and again when reviewing.

## Why AI sites all look the same

A model asked for "a modern, clean landing page" lands on the statistical average of every landing page it has
seen. Telling it to avoid that one look only moves it to the next average. In 2026 "make it warm" reliably
produces cream + serif + terracotta, which is just as recognisable. So the cure is not a list of things to avoid;
it is a **specific source** that the average can't reach: the audience's own places, objects, rituals and
graphic traditions.

## Step 1: Find the world before touching CSS

1. **Who, where, what light.** Write one sentence about the real visitor and scene. For example: "A Mexican-American
   mom on her phone at night after a Facebook ad, wary of scams." This decides light/dark, type size, contrast and
   what "trustworthy" means. Don't pick dark or light by category habit.
2. **List 5-7 concrete things that audience knows by heart.** Places, objects, rituals, print and screen traditions.
   Each one should come with its own colors, materials, shapes and lettering. Leave out the category's own
   visuals (for insurance: shields, handshakes, stock families, blue gradients), because that's the rut. Leave out
   costume clichés too (sombreros, papel picado, lotería for a Latino audience).
3. **Pick one and let it carry the page.** The world should supply the palette, type, shapes, textures, layout
   metaphors and motion, not just a sticker on a template. Worked example from the project that produced this
   skill:
   - *Rejected v1:* cyan-on-white, Fraunces + Inter, frosted-glass card, blurry orbs, spinning glow border.
     Competent, and instantly "AI".
   - *Shipped v2, "Casa de colores":* each section is a lime-washed wall of a Latin American street (marigold,
     turquoise, bougainvillea, indigo) ending in a painted zócalo band. The quiz sits in an arched window with the
     agent's face at the top of the arch. A bougainvillea vine sways with its shadow on the wall. The license sits
     on a talavera tile plaque, testimonials are postcards, and the closing CTA is a door that swings open.
     Fonts: Alegreya / Alegreya Sans (designed in Argentina).
4. **When taste is the user's call, offer two worlds in two or three lines each** (with the honest risk of each)
   and let them pick. That costs one question and avoids a second "it looks AI" round.

More examples of how to find a world are in `references/worlds.md`.

## Step 2: The tells. Treat each one as a reason to stop and choose

None of these is forbidden if the brief or world truly calls for it. But if you reach for one without a reason
you could say out loud, you are running on autopilot. Replace it with something from your world.

**Type**
- Inter, Fraunces, Playfair Display, DM Sans/Serif, Space Grotesk, Plus Jakarta Sans, Outfit, Instrument
  Serif/Sans, Cormorant, Lora, Syne, IBM Plex: the training-data defaults. Pick faces with a story that fits the
  world: where they were designed, what they echo (sign painting, a press, a region). Load the real weights and
  italics; don't let the browser fake them.
- An italic serif "accent word" in gradient color inside a headline.

**Color**
- Cool blue-to-white gradients, purple-to-blue gradients, near-black with one neon accent.
- Cream/off-white ground + serif + terracotta/rust accent (the "warm" default).
- A neutral page with color only in small accents. Let the world's color own whole regions instead.

**Surfaces and effects**
- Glassmorphism (`backdrop-filter: blur`) on cards for no physical reason.
- Big blurred gradient "orbs/blobs" drifting behind the hero.
- Animated grain over everything; spinning conic-gradient glow borders; glowing colored halos as shadows.
- Gradient text (`background-clip: text`).
- Unicode arrows or emoji standing in for icons; mixed icon styles.

**Layout and copy patterns**
- A small uppercase "eyebrow" label above every heading.
- A hero split into copy on the left, a product card on the right and a badge row underneath; or a centered
  headline over a row of three cards.
- Rows of identical icon + heading + text cards as the page structure.
- Hero metric rows ("60s · 20+ · $0") and decorative 01/02/03 section numbers.
- Fake social proof: invented stats, ratings, logos, "María just signed up" toasts, countdown timers.
  Sample content stays visibly labeled as a sample until the real thing arrives.

## Step 3: Motion with authorship

Generic: the same fade-up on every section, hover lifts everywhere, parallax for its own sake, bouncy springs.

Authored: **one focal moment that comes from the world**, plus quiet motion that explains state. From the v2
build:
- The answer you tap floods with paint from the exact point you touched it (`clip-path: circle()` from pointer
  coordinates).
- The question text is "painted on" left to right with a moving `mask-image` gradient instead of fading in.
- Progress squares flip over and become glazed talavera tiles.
- The agent's portrait shows a "typing…" bubble between questions, so the quiz feels like a conversation.
- The vine sways and its blurred shadow on the wall sways a beat later. The pointer acts as the sun.
- The closing door's leaves rotate open in 3D onto the call buttons.

Rules of thumb:
- Reach past opacity/translate: masks, clip-path, filter, 3D transforms and shadows are the materials that make
  motion feel specific.
- Fast feedback (100-300 ms) for controls, 500-800 ms only for the one focal entrance. Exit faster than you enter.
  Use ease-out curves like `cubic-bezier(.16,1,.3,1)`, not bounce by reflex.
- Content must be visible if scripts fail (only hide things behind a `.js` class).
- Pause ambient loops when offscreen or the tab is hidden, and give every animation a
  `prefers-reduced-motion` path that keeps state changes but drops travel and loops.

## Step 4: Details that read as made by a person

- Texture that belongs to the world (lime-wash plaster noise, paper, cloth), static, low opacity, tiling without seams.
- Slight, intentional imperfection: a rotated postcard, a hand-drawn brush underline, a two-color painted shadow
  on sign lettering.
- Theme the browser parts nobody designs: `::selection`, caret color, focus rings per background, scrollbar,
  tabular numbers for phone and license numbers.
- Copy in the audience's real voice (for Spanish: native phrasing and "usted", not translated English). Buttons
  say what happens; errors say how to fix it.

## Step 5: Verify by looking

1. Run `python3 scripts/ai_tells.py <html/css files>` (inside this skill folder) for a quick scan of the
   mechanical tells. Treat findings as questions, not verdicts.
2. Screenshot real sizes: 360x740 and 390x844 phones, 1366x768 and 1440x900 laptops. The main action must be
   visible on the first screen of a phone.
3. **Category guess test:** cover the logo and ask "could someone guess this look from the business category
   alone?" If yes, the world isn't carrying the page yet; push it further rather than polishing.
4. Check contrast on every colored section (body text 4.5:1, large text 3:1), especially text on saturated walls.

## When the user says "it looks AI"

Don't tweak. Name the specific tells you see in your own work, out loud and plainly. Save the current version so
they can compare. Research their audience's world, offer two directions, then rebuild from the chosen world.
Keep the functional parts they liked (in the source project: the auto-advancing quiz).
