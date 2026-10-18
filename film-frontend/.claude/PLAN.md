# PLAN: OctaTrade scroll film

## Status (2026-10-18)
- [x] Folder + template, BRIEF.md
- [x] User chose to reuse the Papermint clips (Downloads/Papermint videos) instead of a new film.
      The emerald-vault Gemini keyframe (hero only) was made first and is not used.
- [x] Joins measured with joinmatch.py: A2|B1 best cut out 7.67 s / in 0.04 s (3.86 vs 2.4 step, 1.6x),
      B1|C3 2.60 vs 2.41 (1.1x), C3|D4 1.54 vs 0.9-1.4 (1.1-1.7x). The full Papermint film has a 3.8x jump
      at 14.79 s, which is motion inside clip B, not a join.
- [x] Film assembled from the clips: 35.7 s, 428 frames, --paper #e3ded2
- [x] Landing with OctaTrade content, Plans/pricing removed (user request)
- [x] app.html: all pages of the old React client (features, not its design), dashboard info-only, scheduler metrics left out (user request); desk-test 32/32 at 1440 and 390
- [x] QA: frames 428/428, over33 0, no horizontal overflow, no console errors (desktop + phone)
- [ ] Optional: an OctaTrade-specific film (the vault prompts below) to replace the Papermint wallet film

## Style preamble (verbatim in every image prompt)
Premium product CGI still, 16:9. Seamless warm bone infinite studio background (#ECE8DF), soft diffused light from upper left, the subject floats in mid-air, no floor, no horizon, no cast shadows on any surface, ultra clean, photoreal materials, Apple-style product reveal, centered, generous empty space around the subject. Palette: emerald green glazed ceramic (#1F6B52), deep green (#123D30), brushed brass (#B48A4A), ivory paper (#F7F4EC). No text, no numbers, no letters, no logos, no portraits, no watermark.

## Keyframes
- K2 hero: {preamble} Subject: a closed octagonal vault box made of glossy emerald green glazed ceramic with thin brushed brass trim along every edge, eight crisp facets, a small brass octagonal dial centred on the lid, viewed at a gentle three-quarter angle from slightly above, a few blank ivory paper notes peeking out from under the lid.
- K1 arrival: attach K2. "Use the attached image for the exact vault design, colors, lighting, camera and background. New frame, same studio: the octagonal vault sits lower in frame with its lid open and tilted up; above it dozens of blank ivory paper notes (plain paper, no print) drift in a loose airy swirl across the upper two thirds."
- K3 exploded: attach K2. Precise exploded view: the lid, the eight ceramic side panels, a stack of brass gears and a brass escapement wheel, eight small emerald octagonal tokens, and a radial fan of blank ivory notes, all floating apart in a balanced radial arrangement, evenly spaced, slightly rotated, like a luxury watch-movement engineering render.
- K4 human moment: attach K3. A graceful sculptural hand of smooth matte white ceramic, porcelain art sculpture, five well-formed fingers, reaches in from the right edge and presses one emerald octagonal token with its index finger; the other parts stay floating behind, softer in focus. No real human skin.
- K5 payoff: attach K4. The parts have folded into a rising candlestick chart floating in mid-air: seven bars of emerald ceramic and brushed brass, left to right climbing upward, thin brass wicks, ivory notes settled as a base; the porcelain hand at the right edge, palm up, having released it.

## Clips (Veo, 8 s, start frame attached; end described)
Template: "Seamless luxury product animation on a pure warm bone infinite studio background from beginning to end. Start exactly on the attached frame: {K(n)}. {motion}, ending exactly on: {K(n+1)}. Slow elegant pacing, precise choreographed motion, calm cinematic camera push-in, soft ambient studio light, crisp material textures, Apple-style product reveal. No text, no numbers, no people, no floor, no shadows, no dark background, no particles, no watermark."
- A (K1->K2): the paper notes spiral gently down into the open vault, the lid swings closed, the camera eases to the three-quarter hero angle.
- B (K2->K3): an elegant exploded-view expansion like a luxury watchmaking presentation, every part rotating slowly in zero gravity in perfectly choreographed engineering motion.
- C (K3->K4): a porcelain ceramic sculpture hand glides in from the right and presses one emerald token, which glows softly as it clicks in.
- D (K4->K5): the parts fold and stack into a rising candlestick chart left to right, the hand opens palm up and withdraws slightly.

Gemini rule: each clip in a NEW chat, with only its start frame attached (Gemini reuses the first image of a chat).

## Reel copy map (FRAME_SPEED 1.12)
001 A 5-18 · 002 B 23-33 · 003 B 36-44 · stats 47-57 · 004 C 60-69 · 005 D 73-84 · CTA 89-100 persist
