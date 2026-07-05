/*
CONTRACT — src/core/state.js (Core State Layer)
1. does:        Holds the entire mutable game/session/scene state in one object.
2. owns:        scene name, match state (both combatants' runtime combat state), round record.
3. needs:       FIGHTER/RIVAL def objects to instantiate combatants (passed in, not imported —
                 keeps this module content-agnostic even though this repo only has one fighter).
4. inputs:      Mutation calls from input/movement/combat/ai/scenes modules only.
5. outputs:     The exported `S` object, read by render/ui modules every frame.
6. connectsTo:  Every other module reads or writes through this object.
7. helps:       Prevents state from being scattered/duplicated across modules.
8. returns:     S (object), newCombatant, resetMatch, resetRound — all named exports.
9. starts:      Initialized at module load in 'boot' scene.
10. finishes:   Reset (not destroyed) whenever a new match/round starts.
*/

export const S = {
  scene: 'boot',
  p1: null, p2: null,
  round: 1, roundWins: [0, 0],
  roundTimer: 99, roundTimerAcc: 0,
  matchOver: false, winnerId: null,
  frame: 0
};

export function newCombatant(def, facing) {
  return {
    def, x: facing === 1 ? 90 : 260, y: 400, facing,
    vx: 0, vy: 0, grounded: true,
    hp: def.hp, hpMax: def.hp,
    state: 'idle', // idle, walk, punch, kick, special, finisher, block, hit, ko
    clipFrame: 0, clipTimer: 0,
    actionTimer: 0, hitstun: 0, blockstun: 0,
    cooldownSpecial: 0, comboCount: 0, comboTimer: 0,
    meter: 0
  };
}

export function resetMatch(f1def, f2def) {
  S.p1 = newCombatant(f1def, 1);
  S.p2 = newCombatant(f2def, -1);
  S.round = 1; S.roundWins = [0, 0];
  S.roundTimer = 99; S.roundTimerAcc = 0;
  S.matchOver = false; S.winnerId = null;
}

export function resetRound() {
  const f1 = S.p1.def, f2 = S.p2.def;
  S.p1 = newCombatant(f1, 1);
  S.p2 = newCombatant(f2, -1);
  S.roundTimer = 99; S.roundTimerAcc = 0;
}

export const contract = {
  does: "Owns the single mutable source of truth for the running session.",
  owns: "S.scene, S.p1, S.p2, S.round, S.roundWins, S.roundTimer.",
  needs: "Fighter def objects passed in by callers (no content import needed).",
  inputs: "Mutations from input/movement/combat/ai/scenes modules.",
  outputs: "The S object, read every frame by render/ui modules.",
  connectsTo: "Every module in the repo.",
  helps: "Single source of truth avoids state drift between modules.",
  returns: "S, newCombatant(), resetMatch(), resetRound().",
  starts: "At module load (scene='boot').",
  finishes: "Reset on new match/round, never fully destroyed."
};
