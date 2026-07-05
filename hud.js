/*
CONTRACT — src/ui/hud.js (UI/HUD Layer)
1. does:        Reflects state.S combatant hp/rounds/timer into the DOM HUD every frame.
2. owns:        #p1bar/#p2bar widths, #p1pips/#p2pips, #timer text, #p1name/#p2name labels.
3. needs:       core/state.js S.p1/p2, S.roundWins, S.roundTimer.
4. inputs:      Current S values, read-only.
5. outputs:     Updated DOM (bar widths, pip classes, timer text). Since there's only one
                 fighter identity in this repo, labels are fixed to "YOU" / "RIVAL" rather
                 than reading a roster name.
6. connectsTo:  core/state.js (reads), scenes/scenes.js (shows/hides HUD on scene change).
7. helps:       Gives the player readable at-a-glance fight status.
8. returns:     Nothing — direct DOM mutation. show(), hide(), step() are named exports.
9. starts:      show() when entering the fight scene.
10. finishes:   hide() when leaving the fight scene.
*/

import { S } from '../core/state.js';

const el = {
  hud: document.getElementById('hud'), timer: document.getElementById('timer'),
  p1bar: document.getElementById('p1bar'), p2bar: document.getElementById('p2bar'),
  p1name: document.getElementById('p1name'), p2name: document.getElementById('p2name'),
  p1pips: document.getElementById('p1pips'), p2pips: document.getElementById('p2pips'),
  kchip: document.getElementById('kchip'), controls: document.getElementById('controls')
};

function buildPips(container, wins) {
  container.innerHTML = '';
  for (let i = 0; i < 2; i++) {
    const p = document.createElement('div');
    p.className = 'pip' + (i < wins ? ' won' : '');
    container.appendChild(p);
  }
}

export function show() {
  el.hud.style.display = 'block'; el.timer.style.display = 'block';
  el.kchip.style.display = 'block'; el.controls.style.display = 'flex';
  el.p1name.textContent = 'YOU';
  el.p2name.textContent = 'RIVAL';
}

export function hide() {
  el.hud.style.display = 'none'; el.timer.style.display = 'none';
  el.kchip.style.display = 'none'; el.controls.style.display = 'none';
}

export function step() {
  const { p1, p2 } = S;
  if (!p1 || !p2) return;
  const p1pct = Math.max(0, (p1.hp / p1.hpMax) * 100);
  const p2pct = Math.max(0, (p2.hp / p2.hpMax) * 100);
  el.p1bar.style.width = p1pct + '%'; el.p2bar.style.width = p2pct + '%';
  el.p1bar.classList.toggle('low', p1pct < 30);
  el.p2bar.classList.toggle('low', p2pct < 30);
  buildPips(el.p1pips, S.roundWins[0]);
  buildPips(el.p2pips, S.roundWins[1]);
  el.timer.textContent = Math.max(0, Math.ceil(S.roundTimer));
  el.kchip.textContent = p1.comboCount >= 2 ? `${p1.comboCount} HIT COMBO — YOU` :
                          p2.comboCount >= 2 ? `${p2.comboCount} HIT COMBO — RIVAL` : '';
}

export const contract = {
  does: "Mirrors combat state into readable DOM HUD elements.",
  owns: "Health bar widths, round pips, timer text, combo chip text, YOU/RIVAL labels.",
  needs: "state.S.p1/p2, roundWins, roundTimer.",
  inputs: "Read-only state.S each frame.",
  outputs: "Updated HUD DOM.",
  connectsTo: "core/state.js, scenes/scenes.js.",
  helps: "Readable at-a-glance fight status for the player.",
  returns: "Nothing (direct DOM mutation). show(), hide(), step().",
  starts: "show() on entering fight scene.",
  finishes: "hide() on leaving fight scene."
};
