/*
CONTRACT — src/boot/boot.js (Boot Layer — the only module index.html imports directly)
1. does:        Runs the CRT boot-text sequence, registers the SW, wires input, waits for the
                 sprite atlas to finish loading, then starts the main loop.
2. owns:        The requestAnimationFrame loop, the boot text sequence, and last-frame timestamp.
3. needs:       Every other module (imported below), and content/spriteAtlas.js's `ready` promise.
4. inputs:      None beyond the initial module evaluation / DOM being ready.
5. outputs:     A running game: bound touch input, registered SW, active rAF loop.
6. connectsTo:  ../../sw.js (registers it), input.bind, scenes.bindMenus, all per-frame module steps.
7. helps:       Gives the whole app one obvious entry point instead of scattered init calls.
8. returns:     Nothing.
9. starts:      run() called at the bottom of this file, which is the <script type="module"> entry.
10. finishes:   Boot sequence finishes when "TAP TO BEGIN" appears; the rAF loop itself never finishes.

TOUCH-ONLY / ANDROID CHROME ONLY:
This module registers zero mouse or keyboard listeners, directly or through any module it
imports. There is no desktop fallback path and none should ever be added here — if a future
input method is needed it must be touch-based (e.g. multi-touch gestures), never mouse/keyboard.
*/

import { S } from '../core/state.js';
import * as INPUT from '../input/input.js';
import * as MOVEMENT from '../movement/movement.js';
import * as COMBAT from '../combat/combat.js';
import * as AI from '../ai/ai.js';
import * as FX from '../fx/fx.js';
import * as HUD from '../ui/hud.js';
import * as RENDER from '../render/render.js';
import * as SCENES from '../scenes/scenes.js';
import { ready as atlasReady } from '../content/spriteAtlas.js';

const bootTexts = [
  'INITIALIZING QUATERBASE CORE...',
  'LOADING FIGHTER SPRITE SHEET...',
  'CALIBRATING TOUCH LAYER... OK',
  'PHOSPHOR DISPLAY READY.'
];

function typeBootSequence() {
  const container = document.getElementById('bootLines');
  let i = 0;
  function next() {
    if (i >= bootTexts.length) {
      document.getElementById('btnStart').style.display = 'inline-block';
      return;
    }
    const line = document.createElement('div');
    line.className = 'boot-line';
    line.textContent = bootTexts[i];
    container.appendChild(line);
    i++;
    // Hold on the sprite-sheet line until the atlas actually resolves, so
    // "TAP TO BEGIN" never appears before the sheet is usable.
    if (bootTexts[i - 1].includes('SPRITE SHEET')) {
      atlasReady.then(() => setTimeout(next, 200)).catch(() => setTimeout(next, 200));
    } else {
      setTimeout(next, 260);
    }
  }
  next();
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    });
  }
}

let lastTs = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;

  if (S.scene === 'fight' && !S.matchOver) {
    S.roundTimerAcc += dt;
    S.roundTimer -= dt;
    if (S.roundTimer <= 0) { S.roundTimer = 0; SCENES.onTimeUp(); }

    AI.step(dt);
    MOVEMENT.step(dt);
    COMBAT.step(dt);
    FX.step(dt);
    HUD.step();
    RENDER.frame(dt);
  } else if (S.scene === 'fight' && S.matchOver) {
    FX.step(dt);
    RENDER.frame(dt);
  }

  requestAnimationFrame(loop);
}

export function run() {
  registerSW();
  INPUT.bind();
  SCENES.bindMenus();
  typeBootSequence();
  SCENES.goto('title');
  requestAnimationFrame(loop);
}

export const contract = {
  does: "Boots the whole game: SW registration, touch-only input binding, menu wiring, main loop.",
  owns: "The rAF loop and the CRT boot-text sequence.",
  needs: "Every module in src/ (imported above) and spriteAtlas.ready.",
  inputs: "None beyond DOM readiness.",
  outputs: "A fully running, installable, offline-capable, touch-only game.",
  connectsTo: "sw.js, input/input.js, scenes/scenes.js, content/spriteAtlas.js, and every per-frame module.",
  helps: "One obvious entry point instead of scattered init calls.",
  returns: "Nothing.",
  starts: "run(), invoked at the bottom of this file.",
  finishes: "Boot text finishes at 'TAP TO BEGIN' (held until the atlas loads); the rAF loop itself never finishes."
};

document.addEventListener('DOMContentLoaded', run);
