# MOBATTLE

A single-fighter, sprite-based, touch-only Android Chrome PWA fighting game. No roster, no
mouse, no keyboard, no Apple/iOS anything — one fighter, one rival, 350×550, Chrome on Android.

## Full file list

```
mobattle/
├── index.html                   # DOM shell + CSS, loads src/boot/boot.js
├── manifest.json                # PWA identity (Android Chrome only)
├── sw.js                        # offline cache of shell + every module + sprite sheet
├── assets/
│   └── fighter_sheet.png        # your uploaded sprite sheet (8 cols x 7 rows, 112px cells)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── content/
│   │   ├── spriteAtlas.js       # slices the sheet, names animation clips
│   │   └── fighter.js           # the ONE fighter + its palette-swapped rival
│   ├── core/
│   │   └── state.js             # single mutable session state (S)
│   ├── input/
│   │   └── input.js             # touch-only capture -> intent (no mouse/keyboard, ever)
│   ├── movement/
│   │   └── movement.js          # x-position / facing resolution
│   ├── combat/
│   │   └── combat.js            # hit detection, damage, blocking, KOs
│   ├── ai/
│   │   └── ai.js                 # rival's behavior
│   ├── fx/
│   │   └── fx.js                 # transient visual events
│   ├── audio/
│   │   └── audio.js              # WebAudio-synthesized SFX
│   ├── ui/
│   │   └── hud.js                # DOM health bars / round pips / timer
│   ├── render/
│   │   └── render.js             # canvas drawing — real sprite frames, not emoji
│   ├── scenes/
│   │   └── scenes.js             # screen state machine (no select screen — 1 fighter)
│   └── boot/
│       └── boot.js               # entry point — wires every module, runs the loop
└── README.md
```

## Why one fighter, not four

You asked for 1, not 4. `content/fighter.js` owns exactly one fighter definition (`FIGHTER`).
Since a fight still needs two combatants, `RIVAL` is the same identity with a canvas
`hue-rotate` tint applied at render time — it is a *rendering variant*, not a second piece of
content. There is no fighter-select screen (a select screen with a single option fails its own
"what does it help?" question); `scenes.js` goes straight from the title screen to a `ready`
scene that just confirms "YOU vs RIVAL" before the fight starts.

## The sprite sheet — how it's used, and an honesty note

`assets/fighter_sheet.png` is your uploaded sheet: an 896×784px grid, 8 columns × 7 rows of
112×112px cells, 54 of the 56 cells populated (the last row only has 6). `spriteAtlas.js` slices
it by row/col and groups specific cells into named clips: `idle`, `walk`, `punch`, `kick`,
`block`, `special`, `hit`, `ko`.

**The sheet has no embedded metadata** — no frame names, no tags. The row/col pairs assigned to
each clip in `CLIPS` are a best-effort *visual* read of the sheet, not a guaranteed-correct
mapping. If a pose looks wrong in-game (e.g. the "kick" clip shows a punch), open
`assets/fighter_sheet.png`, count cells 0-indexed left-to-right/top-to-bottom, and correct the
pair in `src/content/spriteAtlas.js` — that's the only place they're defined, by design, so a
wrong guess is a one-line fix, not an architecture problem.

## Android Chrome only — no fallback, ever

- No `apple-touch-icon`, no `apple-mobile-web-app-capable`, no other iOS/Safari meta tag anywhere.
- No `onclick`, `onmousedown`, `onkeydown`, `<input>`, or any pointer/keyboard listener in any
  file. Every control in `src/input/input.js` binds only `touchstart` / `touchmove` / `touchend`
  / `touchcancel`.
- Fixed 350×550 viewport, `user-scalable=no`, `touch-action: none` throughout — this is not a
  responsive layout and isn't meant to be one.
- Verified: `grep -rniE "mousedown|mouseup|onclick=|keydown|apple|iphone|ios" .` across the whole
  repo returns no matches outside of this README and code comments describing the constraint.

## Running it

- **Locally:** `python3 -m http.server` from the repo root, open on Android Chrome at
  `http://<your-ip>:8000`. ES modules don't load over `file://`, so this must be served.
- **GitHub Pages:** push, enable Pages, open the Pages URL on Android Chrome, "Add to Home Screen".

---

## Full 10-question contract — every file, restated in full

Per your request, here is every file's contract asked and answered start to finish, one more time, before finishing.

### index.html
1. What does it do? — Provides the DOM shell (canvas, HUD, menus, touch controls) and loads the modular game.
2. What does it own? — The `<canvas>`, the touch control DOM, the CRT overlay, the `<style>` block.
3. What does it need? — `src/boot/boot.js` as a module entry, `manifest.json`; nothing external.
4. What does it input? — Touch events only, handled inside `src/input/input.js`. No mouse/keyboard attributes anywhere in this file.
5. What does it output? — A rendered page that `boot.js` brings to life.
6. What does it connect to? — `manifest.json`, `sw.js` (registered from boot.js), `src/boot/boot.js`.
7. What does it help? — Gives every module in `src/` a shared DOM to attach to.
8. What does it return? — Nothing — terminal composition root.
9. What does it start? — Loads `src/boot/boot.js` as `type="module"`.
10. What does it finish? — Never on its own; ends only when the tab/app closes.

### manifest.json
1. Does — Describes the app to Android Chrome so it can be installed and launched standalone.
2. Owns — Name, icons, theme, display mode, start URL.
3. Needs — `icons/icon-192.png`, `icons/icon-512.png`, `index.html` at `start_url`.
4. Inputs — Nothing at runtime.
5. Outputs — Install prompt metadata, home-screen icon, splash theme.
6. Connects to — `index.html`, `sw.js`, `icons/*`.
7. Helps — Installability on Android Chrome specifically (no Apple keys included).
8. Returns — N/A, static descriptor.
9. Starts — The install pipeline the first time Chrome reads it.
10. Finishes — Never; persists for the installed app's lifetime.

### sw.js
1. Does — Caches the app shell (every module + the sprite sheet) so the game works fully offline.
2. Owns — The `mobattle-shell-v1` CacheStorage bucket and its install/activate/fetch lifecycle.
3. Needs — The fixed `SHELL_FILES` list to exist at build time.
4. Inputs — `fetch`/`install`/`activate` events.
5. Outputs — Cached `Response` objects served instead of network requests when offline.
6. Connects to — `index.html` (registers it), the CacheStorage API.
7. Helps — Instant repeat loads and offline play on Android Chrome.
8. Returns — A `Response` for every fetch — cache first, network fallback second.
9. Starts — Caches `SHELL_FILES` on `install`.
10. Finishes — Deletes stale caches from older versions on `activate`.

### assets/fighter_sheet.png
1. Does — Is the raw pixel-art source: 8×7 grid, 112px cells, 54 populated frames.
2. Owns — Nothing — a static binary asset, not a module.
3. Needs — Nothing.
4. Inputs — None.
5. Outputs — Pixel data read by `spriteAtlas.js` via `drawImage`.
6. Connects to — `src/content/spriteAtlas.js` only.
7. Helps — Gives the game its real visual identity instead of the earlier emoji placeholder.
8. Returns — N/A, not executable.
9. Starts — Loaded once via `new Image()` in `spriteAtlas.js`.
10. Finishes — Never; stays resident in memory for the session.

### src/content/spriteAtlas.js
1. Does — Slices the sheet into 112×112 frames and names groups of frames as animation clips.
2. Owns — `FRAME_W`/`FRAME_H`/`COLS`/`ROWS` grid constants, the `image` element, the `CLIPS` map.
3. Needs — `assets/fighter_sheet.png` to exist at a path relative to `index.html`.
4. Inputs — None beyond the image's own load event.
5. Outputs — `image`, `frameRect(row,col)`, `CLIPS`, `ready` (a Promise).
6. Connects to — `content/fighter.js` (clip names by convention), `render/render.js` (draws frames).
7. Helps — Turns one unlabeled sheet into a semantic animation API instead of raw pixel math scattered elsewhere.
8. Returns — `image`, `FRAME_W`, `FRAME_H`, `frameRect()`, `CLIPS`, `ready` — all named exports.
9. Starts — Begins loading the `Image` the instant this module is evaluated.
10. Finishes — `ready` resolves once the image has loaded (or rejects on error).

### src/content/fighter.js
1. Does — Defines the single playable fighter's stats and derives a palette-swapped `RIVAL`.
2. Owns — `FIGHTER`, `RIVAL`.
3. Needs — Nothing directly — clip names are matched by `state` string, not imported here.
4. Inputs — None.
5. Outputs — `FIGHTER`, `RIVAL` named exports.
6. Connects to — `core/state.js` (instantiates combatants), `combat/combat.js` (stats), `render/render.js` (tint).
7. Helps — Single source of truth for the one fighter this repo ships with.
8. Returns — `FIGHTER` (object), `RIVAL` (object).
9. Starts — Evaluated at module load.
10. Finishes — Never mutated at runtime.

### src/core/state.js
1. Does — Holds the entire mutable game/session/scene state in one object.
2. Owns — `S.scene`, `S.p1`, `S.p2`, `S.round`, `S.roundWins`, `S.roundTimer`.
3. Needs — Fighter def objects passed in by callers (content-agnostic).
4. Inputs — Mutation calls from input/movement/combat/ai/scenes modules only.
5. Outputs — The `S` object, read every frame by render/ui modules.
6. Connects to — Every module in the repo.
7. Helps — Prevents state from being scattered/duplicated across modules.
8. Returns — `S`, `newCombatant()`, `resetMatch()`, `resetRound()`.
9. Starts — Initialized at module load (`scene='boot'`).
10. Finishes — Reset on new match/round, never fully destroyed.

### src/input/input.js
1. Does — Reads raw touch events and normalizes them into an intent object.
2. Owns — The joystick vector and the 4 action-button pressed states.
3. Needs — `#stick` and the 4 `#btn*` DOM elements.
4. Inputs — `touchstart`/`touchmove`/`touchend`/`touchcancel` only — no mouse/keyboard events bound anywhere.
5. Outputs — The live `intent` export, continuously updated.
6. Connects to — `combat/combat.js`, `movement/movement.js`.
7. Helps — Isolates browser touch quirks from gameplay logic.
8. Returns — `intent` object, `bind()` function.
9. Starts — `bind()` called during boot.
10. Finishes — Never unbinds during the app session.

### src/movement/movement.js
1. Does — Resolves footsies: turns intent into x movement and facing.
2. Owns — `vx`/`x` mutation and facing resolution.
3. Needs — `state.S.p1/p2`, `input.intent`, `ai.intent`.
4. Inputs — `moveX` per combatant per frame.
5. Outputs — Mutated `x`/`facing` on both combatants.
6. Connects to — `core/state.js`, `input/input.js`, `ai/ai.js`, `combat/combat.js`.
7. Helps — Separates spacing logic from hit resolution.
8. Returns — Nothing (in-place mutation); `step(dt)` is the export.
9. Starts — Once per frame from the fight loop.
10. Finishes — When both combatants' `x` are resolved that frame.

### src/combat/combat.js
1. Does — Resolves attacks into damage, blocks, combos, KOs.
2. Owns — `state`/`actionTimer`/`hitstun`/`blockstun`/`hp`/`comboCount`/`meter`/clip cursor on combatants.
3. Needs — `state.S`, `input.intent`, `ai.intent`, `audio.sfx`, `fx` hooks, `scenes.onKO`.
4. Inputs — Per-frame action booleans + inter-fighter distance.
5. Outputs — hp deltas, hitstun/blockstun, combo counters, KO trigger, and the `.state` string `render.js` reads as a clip key.
6. Connects to — `core/state.js`, `movement/movement.js`, `audio/audio.js`, `fx/fx.js`, `scenes/scenes.js`.
7. Helps — Is the core fight simulation the whole game is built around.
8. Returns — Nothing directly (in-place mutation); `step(dt)` is the export.
9. Starts — Once per frame after `movement.step` in the fight loop.
10. Finishes — A round the instant a combatant's hp reaches 0.

### src/ai/ai.js
1. Does — Generates the RIVAL's behavior heuristically so single-player fights work.
2. Owns — The `intent` export.
3. Needs — `state.S.p1/p2` (position, state, hp, cooldowns).
4. Inputs — Distance to opponent, own cooldown, opponent's current action state.
5. Outputs — `intent`, refreshed every 0.12–0.3s decision tick.
6. Connects to — `movement/movement.js`, `combat/combat.js`.
7. Helps — Enables solo play against the rival without a second device/player.
8. Returns — `intent` object, `step(dt)`.
9. Starts — `step(dt)` each frame from the fight loop.
10. Finishes — Each decision resolves within its own tick window.

### src/fx/fx.js
1. Does — Tracks and expires transient visual feedback events.
2. Owns — The `active[]` FX list.
3. Needs — `#flashBanner` DOM element for banner-type entries.
4. Inputs — `hitSpark`/`comboPop`/`flashBanner`/`bigBanner` calls.
5. Outputs — `active[]` consumed by `render/render.js` each frame.
6. Connects to — `combat/combat.js`, `render/render.js`, `scenes/scenes.js`.
7. Helps — Adds arcade juice without coupling combat math to canvas drawing.
8. Returns — `active` array, `hitSpark()`, `comboPop()`, `flashBanner()`, `bigBanner()`, `step(dt)`.
9. Starts — When an entry is pushed.
10. Finishes — When `ttl<=0` in `step(dt)`.

### src/audio/audio.js
1. Does — Synthesizes SFX with WebAudio oscillators — no audio files needed.
2. Owns — The shared `AudioContext`.
3. Needs — A user gesture to unlock playback (Chrome autoplay policy).
4. Inputs — `sfx(name)` calls.
5. Outputs — Short tones through the speaker.
6. Connects to — `combat/combat.js`, `scenes/scenes.js`.
7. Helps — Audio feedback with zero bundle weight, stays offline-safe.
8. Returns — Nothing (fire-and-forget); `unlock()`, `sfx()` functions.
9. Starts — `unlock()` on first tap; `sfx()` per call.
10. Finishes — Each tone self-terminates via its gain envelope.

### src/ui/hud.js
1. Does — Mirrors combat state into readable DOM HUD elements.
2. Owns — Health bar widths, round pips, timer text, combo chip text, YOU/RIVAL labels.
3. Needs — `state.S.p1/p2`, `roundWins`, `roundTimer`.
4. Inputs — Read-only `state.S` each frame.
5. Outputs — Updated HUD DOM.
6. Connects to — `core/state.js`, `scenes/scenes.js`.
7. Helps — Readable at-a-glance fight status for the player.
8. Returns — Nothing (direct DOM mutation); `show()`, `hide()`, `step()`.
9. Starts — `show()` on entering fight scene.
10. Finishes — `hide()` on leaving fight scene.

### src/render/render.js
1. Does — Paints the current fight frame to the canvas using real sprite frames.
2. Owns — The 2D drawing context, draw order, and per-combatant clip-frame cursor.
3. Needs — `state.S.p1/p2`, `spriteAtlas.image`/`CLIPS`/`frameRect`, `fx.active`.
4. Inputs — Read-only state each frame, plus `dt` for animation timing.
5. Outputs — Pixels on `#screen` canvas, sourced from `assets/fighter_sheet.png`.
6. Connects to — `core/state.js`, `content/spriteAtlas.js`, `fx/fx.js`.
7. Helps — Gives the fight its real pixel-art visual identity instead of an emoji placeholder.
8. Returns — Nothing (direct canvas draw); `frame(dt)` is the export.
9. Starts — `frame(dt)` each rAF tick in the fight scene, once the atlas has loaded.
10. Finishes — When the frame is fully painted.

### src/scenes/scenes.js
1. Does — Owns which screen is showing and the rules for moving between screens.
2. Owns — `S.scene` and menu DOM visibility.
3. Needs — `core/state.js`, `content/fighter.js`, `ui/hud.js`, `fx/fx.js`, `audio/audio.js`.
4. Inputs — Button taps on menu screens (touch only).
5. Outputs — Scene transitions + updated round/winner state.
6. Connects to — Nearly every layer — `combat.js` calls into it via `onKO`.
7. Helps — Turns separate screens into one coherent title→champion flow, without a pointless single-option select screen.
8. Returns — Nothing (mutates `S.scene` + DOM); `goto`/`onKO`/`onTimeUp`/`bindMenus`.
9. Starts — `goto('title')` from `boot/boot.js`.
10. Finishes — When the player wins the match or is tapped out.

### src/boot/boot.js
1. Does — Boots the whole game: SW registration, touch-only input binding, menu wiring, main loop.
2. Owns — The rAF loop and the CRT boot-text sequence.
3. Needs — Every module in `src/` and `spriteAtlas.ready`.
4. Inputs — None beyond DOM readiness.
5. Outputs — A fully running, installable, offline-capable, touch-only game.
6. Connects to — `sw.js`, `input/input.js`, `scenes/scenes.js`, `content/spriteAtlas.js`, every per-frame module.
7. Helps — One obvious entry point instead of scattered init calls.
8. Returns — Nothing.
9. Starts — `run()`, invoked at the bottom of the file on `DOMContentLoaded`.
10. Finishes — Boot text finishes at "TAP TO BEGIN" (held until the atlas loads); the rAF loop itself never finishes.

## Resolved

- **Finisher trigger** — the special input now checks `meter >= 100` first; if true it starts the `finisher` action (dedicated sprite clip, wider hit range, `finisherDmg`, its own SFX and banner) and zeroes the meter, instead of the normal special. Both fighters' meter bars are now visible in the HUD, glowing gold when a finisher is ready.
- **Save/load** — `src/persist/persist.js` records round wins/losses/championships to `localStorage`, loaded before the title screen renders and updated on every round/match outcome. The title screen shows a running record line once there's history.

## What's still not included (and which question it fails)

- **Exact sprite semantics** — the `CLIPS` row/col mapping in `spriteAtlas.js` (including the new `finisher` entry, which reuses the existing best-effort `special` frames) is a best-effort visual read of an unlabeled sheet, not verified ground truth. Fails question 1 (what does it do?) in the strict sense until you eyeball-correct it against the actual sheet.
- **Difficulty select** — `ai.js` has one fixed behavior profile; there's no easy/normal/hard toggle anywhere.
