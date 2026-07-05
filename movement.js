/*
CONTRACT — src/movement/movement.js (Movement Layer)
1. does:        Applies joystick intent (P1) or AI intent (P2/RIVAL) to x-position, clamps to arena.
2. owns:        vx/x mutation on combatant objects; does not own hp or action state.
3. needs:       core/state.js S.p1/p2, input.intent (P1), ai.intent (RIVAL).
4. inputs:      moveX in [-1,1] per combatant per frame.
5. outputs:     Mutated x on each combatant, and facing flips when fighters cross.
6. connectsTo:  core/state.js (mutates it), input/ai (reads intents), combat/combat.js (reads resulting x).
7. helps:       Keeps footsies/spacing logic separate from hit-resolution logic.
8. returns:     Nothing — mutates S in place via step(dt).
9. starts:      Called once per frame from the fight-scene loop in boot/boot.js.
10. finishes:   Each call finishes when both combatants' x are resolved for that frame.
*/

import { S } from '../core/state.js';
import { intent as playerIntent } from '../input/input.js';
import { intent as aiIntent } from '../ai/ai.js';

const ARENA_MIN = 30, ARENA_MAX = 320;

export function step(dt) {
  const { p1, p2 } = S;
  if (!p1 || !p2) return;

  applyIntent(p1, playerIntent.moveX, p1.def.speed, dt);
  applyIntent(p2, aiIntent.moveX, p2.def.speed, dt);

  p1.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX, p1.x));
  p2.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX, p2.x));

  p1.facing = p1.x <= p2.x ? 1 : -1;
  p2.facing = p2.x <= p1.x ? 1 : -1;
}

function applyIntent(c, moveX, speed, dt) {
  if (c.hitstun > 0 || c.blockstun > 0) return;
  if (c.state === 'punch' || c.state === 'kick' || c.state === 'special' || c.state === 'finisher') return;
  c.vx = moveX * speed * 60 * dt;
  c.x += c.vx;
  c.state = Math.abs(moveX) > 0.15 ? 'walk' : (c.state === 'walk' ? 'idle' : c.state);
}

export const contract = {
  does: "Resolves footsies: turns intent into x movement and facing.",
  owns: "vx/x mutation and facing resolution.",
  needs: "state.S.p1/p2, input.intent, ai.intent.",
  inputs: "moveX per combatant per frame.",
  outputs: "Mutated x/facing on both combatants.",
  connectsTo: "core/state.js, input/input.js, ai/ai.js, combat/combat.js.",
  helps: "Separates spacing logic from hit resolution.",
  returns: "Nothing (in-place mutation), step() function.",
  starts: "Once per frame from the fight loop.",
  finishes: "When both combatants' x are resolved that frame."
};
