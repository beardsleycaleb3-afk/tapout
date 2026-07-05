# MOBATTLE — Merged Contract Reference

One document, one repo, every file — the final state of everything built in this thread,
answered in the literal question framing from the start: "What does it do?" and the nine
questions that follow it, asked and answered per file, no shorthand.

---

## index.html

1. What does it do? — Provides the DOM shell (canvas, HUD, menus, touch controls) and loads the modular game.
2. What does it own? — The `<canvas>`, the touch control DOM, the CRT overlay, the `<style>` block.
3. What does it need? — `src/boot/boot.js` as a module entry, `manifest.json`; nothing external, no CDN, no build step.
4. What does it input? — Touch events only, handled inside `src/input/input.js`. No mouse/keyboard attributes anywhere in this file.
5. What does it output? — A rendered page that `boot.js` then brings to life.
6. What does it connect to? — `manifest.json`, `sw.js` (registered from boot.js), `src/boot/boot.js`.
7. What does it help? — Gives every module in `src/` a shared DOM to attach to.
8. What does it return? — Nothing — it is the terminal composition root, not a module other files import.
9. What does it start? — Loads `src/boot/boot.js` as `type="module"`, which self-invokes `run()` on `DOMContentLoaded`.
10. What does it finish? — Never on its own; ends only when the tab/app is closed.

## manifest.json

1. What does it do? — Describes the app to Android Chrome so it can be installed and launched standalone.
2. What does it own? — App identity: name, icons, theme, display mode, start URL.
3. What does it need? — `icons/icon-192.png`, `icons/icon-512.png`, `index.html` to exist at `start_url`.
4. What does it input? — Nothing at runtime — read once by Chrome's install/PWA layer.
5. What does it output? — Install prompt metadata, home-screen icon, splash theme.
6. What does it connect to? — `index.html` (`start_url`), `sw.js` (registered from boot.js), `icons/*`.
7. What does it help? — Makes MOBATTLE installable and feel native on Android Chrome specifically — no Apple/iOS keys included, ever.
8. What does it return? — N/A — a static descriptor, not executable.
9. What does it start? — The install pipeline the first time Chrome reads it from `<head>`.
10. What does it finish? — Nothing — persists for the lifetime of the installed app.

## sw.js

1. What does it do? — Caches the app shell — every module in `src/` plus the sprite sheet — so the game works fully offline.
2. What does it own? — The `mobattle-shell-v1` CacheStorage bucket and its install/activate/fetch lifecycle.
3. What does it need? — The fixed `SHELL_FILES` list to exist at build time.
4. What does it input? — `fetch` events from the page; `install`/`activate` events from the browser.
5. What does it output? — Cached `Response` objects served instead of network requests when offline.
6. What does it connect to? — `index.html` (registers it), the CacheStorage API, the browser's SW runtime.
7. What does it help? — Instant repeat loads and offline play on Android Chrome.
8. What does it return? — A `Response` for every fetch — cached copy first, network fallback second.
9. What does it start? — Caching of `SHELL_FILES` on `install`; cache cleanup on `activate`.
10. What does it finish? — Stale caches from older versions are deleted on `activate`.

## icons/icon-192.png, icons/icon-512.png

1. What does it do? — Provides the installed-app icon at two required resolutions.
2. What does it own? — Nothing — a static binary asset.
3. What does it need? — Nothing.
4. What does it input? — None.
5. What does it output? — Pixel data read by the OS install UI.
6. What does it connect to? — `manifest.json` only.
7. What does it help? — Home-screen/app-drawer identity once installed.
8. What does it return? — N/A.
9. What does it start? — Nothing — passive asset.
10. What does it finish? — Never.

## assets/fighter_sheet.png

1. What does it do? — Is the raw pixel-art source: an 8-column × 7-row grid of 112px cells, 54 of 56 cells populated.
2. What does it own? — Nothing — a static binary asset, not a module.
3. What does it need? — Nothing.
4. What does it input? — None.
5. What does it output? — Pixel data read by `spriteAtlas.js` via `drawImage`.
6. What does it connect to? — `src/content/spriteAtlas.js` only.
7. What does it help? — Gives the game its real visual identity, replacing the emoji placeholder used in the two earlier builds this thread produced.
8. What does it return? — N/A — not executable.
9. What does it start? — Loaded once via `new Image()` inside `spriteAtlas.js`.
10. What does it finish? — Never; stays resident in memory for the session.

## src/content/spriteAtlas.js

1. What does it do? — Slices the sheet into addressable 112×112 frames and names groups of frames as animation clips.
2. What does it own? — `FRAME_W`/`FRAME_H`/`COLS`/`ROWS` grid constants, the `image` element, the `CLIPS` map.
3. What does it need? — `assets/fighter_sheet.png` to exist at a path relative to `index.html`.
4. What does it input? — None beyond the image's own load event.
5. What does it output? — `image`, `frameRect(row,col)`, `CLIPS`, `ready` (a Promise) — all named exports.
6. What does it connect to? — `content/fighter.js` (clip names by convention), `render/render.js` (draws frames from it).
7. What does it help? — Turns one unlabeled sheet into a semantic animation API instead of raw pixel math scattered through the codebase. Note: the row/col assignment per clip is a best-effort *visual* read, not verified ground truth — corrections go here and nowhere else.
8. What does it return? — `image`, `FRAME_W`, `FRAME_H`, `frameRect()`, `CLIPS`, `ready`.
9. What does it start? — Begins loading the `Image` the instant this module is evaluated.
10. What does it finish? — `ready` resolves once the image has loaded (or rejects on error).

## src/content/fighter.js

1. What does it do? — Defines the single playable fighter's stats and derives a palette-swapped `RIVAL` so a solo fight has an opponent.
2. What does it own? — `FIGHTER`, `RIVAL`.
3. What does it need? — Nothing directly — no import of the atlas; clip names are matched by `state` string elsewhere.
4. What does it input? — None.
5. What does it output? — `FIGHTER`, `RIVAL` named exports.
6. What does it connect to? — `core/state.js` (instantiates combatants from these), `combat/combat.js` (reads stats), `render/render.js` (reads the tint).
7. What does it help? — Is the single source of truth for the one fighter this repo ships with — deliberately one, not the four fighters the first two builds in this thread had.
8. What does it return? — `FIGHTER` (object), `RIVAL` (object).
9. What does it start? — Evaluated at module load.
10. What does it finish? — Never mutated at runtime — read-only content.

## src/core/state.js

1. What does it do? — Holds the entire mutable game/session/scene state in one object.
2. What does it own? — `S.scene`, `S.p1`, `S.p2`, `S.round`, `S.roundWins`, `S.roundTimer`.
3. What does it need? — Fighter def objects passed in by callers — kept content-agnostic even though this repo only has one fighter.
4. What does it input? — Mutation calls from input/movement/combat/ai/scenes modules only.
5. What does it output? — The `S` object, read every frame by render/ui modules.
6. What does it connect to? — Every other module in the repo, directly or indirectly.
7. What does it help? — Prevents state from being scattered or duplicated across modules — the same role it played in both earlier builds.
8. What does it return? — `S`, `newCombatant()`, `resetMatch()`, `resetRound()`.
9. What does it start? — Initialized at module load in the `'boot'` scene.
10. What does it finish? — Reset (not destroyed) whenever a new match/round starts.

## src/input/input.js

1. What does it do? — Reads raw touch events and turns them into a normalized intent object.
2. What does it own? — The virtual joystick vector and the four action-button pressed states.
3. What does it need? — DOM elements `#stick` and `#btnPunch`/`#btnKick`/`#btnBlock`/`#btnSpecial`.
4. What does it input? — `touchstart`/`touchmove`/`touchend`/`touchcancel` only. No mouse or keyboard listener exists in this file or anywhere it's imported.
5. What does it output? — The live `intent` export: `{ moveX, punch, kick, block, special }`.
6. What does it connect to? — `combat/combat.js` (reads action flags), `movement/movement.js` (reads `moveX`).
7. What does it help? — Isolates browser touch quirks from gameplay logic.
8. What does it return? — `intent` object, `bind()` function.
9. What does it start? — `bind()` called once during boot.
10. What does it finish? — Never — listeners persist for the app's lifetime.

## src/movement/movement.js

1. What does it do? — Applies joystick intent (player) or AI intent (rival) to x-position, and clamps both to the arena.
2. What does it own? — `vx`/`x` mutation and facing resolution on combatant objects; does not own hp or action state.
3. What does it need? — `state.S.p1/p2`, `input.intent`, `ai.intent`.
4. What does it input? — `moveX` in `[-1, 1]` per combatant per frame.
5. What does it output? — Mutated `x` on each combatant, and facing flips when the fighters cross.
6. What does it connect to? — `core/state.js` (mutates it), `input/input.js` and `ai/ai.js` (reads intents), `combat/combat.js` (reads resulting `x`).
7. What does it help? — Keeps footsies/spacing logic separate from hit-resolution logic.
8. What does it return? — Nothing — mutates `S` in place; `step(dt)` is the export.
9. What does it start? — Called once per frame from the fight loop in `boot/boot.js`.
10. What does it finish? — Each call finishes when both combatants' `x` are resolved for that frame.

## src/combat/combat.js

1. What does it do? — Turns action intents into attacks and resolves hits, blocks, damage, and KOs.
2. What does it own? — `state`/`actionTimer`/`hitstun`/`blockstun`/`hp`/`comboCount`/`meter`/clip cursor on both combatants.
3. What does it need? — `state.S`, `input.intent`, `ai.intent`, `audio.sfx`, `fx` hooks, `scenes.onKO`.
4. What does it input? — Per-frame `punch`/`kick`/`special`/`block` booleans plus the current distance between fighters.
5. What does it output? — hp deltas, hitstun/blockstun, combo counters, the KO trigger, and the `.state` string that `render.js` reads as a sprite-clip key.
6. What does it connect to? — `core/state.js`, `movement/movement.js`, `audio/audio.js`, `fx/fx.js`, `scenes/scenes.js`.
7. What does it help? — Is the actual fight — the core value proposition of the whole build, unchanged in intent across all three versions made this thread.
8. What does it return? — Nothing directly (in-place mutation); `step(dt)` is the export `boot.js` calls.
9. What does it start? — Once per frame, after `movement.step`, in the fight loop.
10. What does it finish? — A round, the instant a combatant's hp reaches zero — by delegating to `scenes.onKO`.

## src/ai/ai.js

1. What does it do? — Produces an intent object for the rival by reading distance, hp, and cooldown timers heuristically.
2. What does it own? — The exported `intent` object — same shape as `input.intent`, computer-generated.
3. What does it need? — `state.S.p1/p2` positions and hp to decide behavior.
4. What does it input? — Distance to the opponent, its own cooldown, the opponent's current action state.
5. What does it output? — `intent{moveX,punch,kick,block,special}`, refreshed on a 0.12–0.3s decision tick.
6. What does it connect to? — `movement/movement.js` (reads `moveX`), `combat/combat.js` (reads action flags).
7. What does it help? — Makes single-player fights against the rival possible without a second human.
8. What does it return? — `intent` object, `step(dt)`.
9. What does it start? — `step(dt)` called once per frame from the fight loop.
10. What does it finish? — Each decision finishes within its own tick; it's re-decided next tick.

## src/fx/fx.js

1. What does it do? — Tracks short-lived visual events for `render.js` to draw and expire.
2. What does it own? — The `active[]` list of FX entries (sparks, banners, combo text).
3. What does it need? — Nothing external beyond the `#flashBanner` DOM element for banner-type entries.
4. What does it input? — Calls like `hitSpark(x,y)`, `flashBanner(text)`, `comboPop(n)`.
5. What does it output? — `active[]`, read by `render/render.js` every frame.
6. What does it connect to? — `combat/combat.js` (triggers), `render/render.js` (consumes), `scenes/scenes.js` (round-win banners).
7. What does it help? — Adds arcade visual feedback without coupling combat math to canvas drawing code.
8. What does it return? — `active` array, `hitSpark()`, `comboPop()`, `flashBanner()`, `bigBanner()`, `step(dt)`.
9. What does it start? — An entry starts the instant it's pushed onto `active`.
10. What does it finish? — Each entry finishes — is removed — when its `ttl` reaches zero in `step(dt)`.

## src/audio/audio.js

1. What does it do? — Synthesizes short SFX tones for hits, blocks, and specials using raw oscillators.
2. What does it own? — One shared `AudioContext` and its unlock state.
3. What does it need? — A user gesture to unlock the `AudioContext`, per Chrome's autoplay policy.
4. What does it input? — `sfx(name)` calls from `combat/combat.js` and `scenes/scenes.js`.
5. What does it output? — Short synthesized tones played through the device speaker.
6. What does it connect to? — `combat/combat.js` (hit/block/special/punch/kick cues), `scenes/scenes.js` (menu confirm).
7. What does it help? — Adds audio feedback with zero asset weight, keeping the app fully offline-safe.
8. What does it return? — Nothing — fire-and-forget playback; `unlock()` and `sfx()` are the exports.
9. What does it start? — `unlock()` on the first tap; `sfx()` starts a tone per call.
10. What does it finish? — Each tone finishes itself via its own gain-envelope `stop()`.

## src/ui/hud.js

1. What does it do? — Reflects combatant hp, round wins, and the timer into the DOM HUD every frame.
2. What does it own? — `#p1bar`/`#p2bar` widths, `#p1pips`/`#p2pips`, `#timer` text, the `YOU`/`RIVAL` name labels.
3. What does it need? — `state.S.p1/p2`, `S.roundWins`, `S.roundTimer`.
4. What does it input? — Read-only `state.S` values each frame.
5. What does it output? — Updated HUD DOM: bar widths, pip classes, timer text, combo chip text.
6. What does it connect to? — `core/state.js` (reads), `scenes/scenes.js` (shows/hides the HUD on scene change).
7. What does it help? — Gives the player readable, at-a-glance fight status.
8. What does it return? — Nothing — direct DOM mutation; `show()`, `hide()`, `step()` are the exports.
9. What does it start? — `show()` when entering the fight scene.
10. What does it finish? — `hide()` when leaving the fight scene.

## src/render/render.js

1. What does it do? — Draws the current frame: the arena backdrop, both sprite-based fighters, and active FX.
2. What does it own? — The 2D canvas context, all draw-order decisions, and the per-combatant animation-frame cursor.
3. What does it need? — `state.S.p1/p2`, `content/spriteAtlas.js` (image, `CLIPS`, `frameRect`), `fx.active`.
4. What does it input? — Current state and FX list, read-only, plus `dt` for animation timing; `combatant.state` doubles as the `CLIPS` lookup key.
5. What does it output? — Pixels on `<canvas id="screen">`, drawn from the real uploaded sprite sheet — replacing the emoji-glyph rendering used in the first two builds this thread produced.
6. What does it connect to? — `core/state.js`, `content/spriteAtlas.js`, `fx/fx.js`.
7. What does it help? — Gives the fight its actual visual identity instead of a placeholder.
8. What does it return? — Nothing — direct canvas draw calls; `frame(dt)` is the export.
9. What does it start? — `frame(dt)` called once per rAF tick while `scene === 'fight'`, once the atlas has finished loading.
10. What does it finish? — Each call finishes when the frame is fully painted.

## src/scenes/scenes.js

1. What does it do? — Owns which screen is active and the transition rules between screens.
2. What does it own? — `S.scene` and the visibility of every `.menu` block in the DOM.
3. What does it need? — `core/state.js`, `content/fighter.js` (`FIGHTER`/`RIVAL`), `ui/hud.js`, `fx/fx.js`, `audio/audio.js`.
4. What does it input? — Button taps on menu screens — `touchstart` only.
5. What does it output? — Scene transitions and updated `S.round`/`roundWins`/`winnerId`.
6. What does it connect to? — Nearly every layer — it's the orchestrator `combat.js` calls into via `onKO`.
7. What does it help? — Turns separate screens into one coherent title→champion flow. There is no fighter-select screen here, unlike the earlier four-fighter builds — a select screen with one option would fail its own "what does it help?" question, so it's replaced with a `ready` scene confirming "YOU vs RIVAL."
8. What does it return? — Nothing — mutates `S.scene` and the DOM; `goto`/`onKO`/`onTimeUp`/`bindMenus` are the exports.
9. What does it start? — `goto('title')`, called once from `boot/boot.js`.
10. What does it finish? — The whole match, when the player wins it or is tapped out.

## src/boot/boot.js

1. What does it do? — Boots the whole game: registers the service worker, binds touch input, wires the menus, and starts the main loop.
2. What does it own? — The `requestAnimationFrame` loop, the last-frame timestamp, and the CRT boot-text sequence.
3. What does it need? — Every module in `src/`, and `spriteAtlas.js`'s `ready` promise specifically, so the loop never starts drawing before the sheet exists.
4. What does it input? — Nothing beyond the DOM being ready.
5. What does it output? — A fully running, installable, offline-capable, touch-only game.
6. What does it connect to? — `sw.js`, `input/input.js`, `scenes/scenes.js`, `content/spriteAtlas.js`, and every per-frame module.
7. What does it help? — Gives the whole app one obvious entry point instead of scattered init calls across files.
8. What does it return? — Nothing.
9. What does it start? — `run()`, invoked at the bottom of the file on `DOMContentLoaded`.
10. What does it finish? — The boot sequence finishes at "TAP TO BEGIN" (held until the atlas resolves); the `requestAnimationFrame` loop itself never finishes.

## README.md

1. What does it do? — Documents the repo: file list, the one-fighter decision, the honest sprite-mapping caveat, and the Android-only/touch-only guarantee.
2. What does it own? — The written record of every decision this file list represents.
3. What does it need? — The finished repo to describe accurately.
4. What does it input? — Nothing at runtime — it's read by a person, not a program.
5. What does it output? — A plain-language explanation for anyone opening the repo cold.
6. What does it connect to? — Every file in the repo, by reference.
7. What does it help? — Anyone extending this later, including a future version of me, understand why things are the way they are before changing them.
8. What does it return? — Nothing — documentation, not code.
9. What does it start? — Nothing — it's read, not executed.
10. What does it finish? — Nothing — it's a living document that should be updated as the repo changes.

---

### Resolved this pass

- **Finisher trigger** — `combat.js` now checks `attacker.meter >= 100` on the special input before falling through to the normal special: it starts the `finisher` action, zeroes the meter, hits for `FIGHTER.finisherDmg` on `RANGE_FINISHER` (wider than the normal special), plays a dedicated `finisher` SFX, and fires `FX.bigBanner()`. `spriteAtlas.js` gained a matching `finisher` clip so the state renders real frames instead of falling back to `idle`. `hud.js`/`index.html` gained a visible meter bar per fighter that glows gold at 100%, so the player can see the finisher coming. Answers question 9 (*what does it start?*) for both fighters.
- **Save/load** — new `src/persist/persist.js` module. Records round wins/losses/championships to `localStorage['mobattle_record_v1']`, loaded at module evaluation (imported from `boot.js` before the title screen ever renders) and updated from `scenes.js` at every round/match outcome. The title screen shows a `RECORD: NW–ML · N TITLES` line once there's history. `sw.js` cache bumped to `v2` and the new file added to `SHELL_FILES` so it's offline-cached too. Answers question 8 (*what does it return?*) at the session boundary — the record now survives a reload.
- **Sprite semantics** — still an open item; see below. The new `finisher` clip reuses the existing best-effort `special` frame reads rather than introducing new unverified row/col guesses, so it doesn't add to this gap.

### What's still open

- **Sprite semantics** — the `CLIPS` row/col mapping in `spriteAtlas.js` (including the new `finisher` entry) is a best-effort visual read of an unlabeled sheet, not verified ground truth. Fails question 1 in the strict sense — *what does it do?* — until someone opens `assets/fighter_sheet.png`, counts cells 0-indexed left-to-right/top-to-bottom, and corrects the pairs in `CLIPS`. That's the only place they're defined.
- **Difficulty select** — no difficulty concept exists anywhere in `ai.js`; the AI has one fixed behavior profile. Not in the original three-item list but worth flagging if a difficulty toggle is wanted later — it would live in `ai.js`'s decision thresholds, gated by a choice on the title or ready screen.
