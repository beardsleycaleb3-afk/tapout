/*
CONTRACT — src/scenes/scenes.js (Scene/State Machine Layer)
1. does:        Owns which screen is active and the transition rules between screens.
2. owns:        S.scene, DOM visibility of every .menu block.
3. needs:       core/state.js (mutate scene + match data), content/fighter.js (FIGHTER/RIVAL),
                 ui/hud.js, fx/fx.js, audio/audio.js.
4. inputs:      Button taps (start, ready-to-fight, next round, rematch, retry, main menu).
5. outputs:     Scene transitions, updated S.round/roundWins/winnerId.
6. connectsTo:  Nearly every layer — this is the orchestrator combat.js calls into via onKO.
7. helps:       Turns a pile of screens into one coherent flow: boot -> title -> ready -> fight
                 -> round-end -> champion/gameover -> title/rematch.
8. returns:     Nothing — mutates S.scene and DOM. goto/onKO/onTimeUp/bindMenus are named exports.
9. starts:      goto('title') called once from boot/boot.js.
10. finishes:   The whole match finishes when the player wins the match or is tapped out.

WHY THERE'S NO SELECT SCENE:
The previous (4-fighter) build had a fighter-select grid here. This repo ships exactly one
fighter, so there's nothing to select — a select screen with one tappable option would fail
its own "what does it help?" question (it wouldn't help anyone choose anything). It's replaced
with a READY scene that simply confirms "YOU vs RIVAL" and starts the match on tap.
*/

import { S, resetMatch, resetRound } from '../core/state.js';
import { FIGHTER, RIVAL } from '../content/fighter.js';
import * as HUD from '../ui/hud.js';
import * as FX from '../fx/fx.js';
import * as AUDIO from '../audio/audio.js';

const menus = {
  title: document.getElementById('menuTitle'),
  ready: document.getElementById('menuReady'),
  roundEnd: document.getElementById('menuRoundEnd'),
  champion: document.getElementById('menuChampion'),
  gameOver: document.getElementById('menuGameOver')
};

function hideAllMenus() { Object.values(menus).forEach(m => m.classList.add('hidden')); }

export function goto(scene) {
  S.scene = scene;
  hideAllMenus();
  if (scene === 'fight') HUD.show(); else HUD.hide();

  if (scene === 'title') menus.title.classList.remove('hidden');
  if (scene === 'ready') menus.ready.classList.remove('hidden');
  if (scene === 'roundEnd') menus.roundEnd.classList.remove('hidden');
  if (scene === 'champion') menus.champion.classList.remove('hidden');
  if (scene === 'gameOver') menus.gameOver.classList.remove('hidden');
}

function startMatch() {
  resetMatch(FIGHTER, RIVAL);
  goto('fight');
}

export function onKO(winner, loser) {
  AUDIO.sfx('ko');
  const p1Won = winner === S.p1;
  S.roundWins[p1Won ? 0 : 1]++;
  FX.bigBanner(p1Won ? 'YOU WIN THE ROUND!' : 'RIVAL WINS THE ROUND!', 1400);

  setTimeout(() => {
    if (S.roundWins[0] >= 2 || S.roundWins[1] >= 2) {
      const playerWon = S.roundWins[0] >= 2;
      S.winnerId = playerWon ? S.p1.def.id : S.p2.def.id;
      S.matchOver = true;
      if (playerWon) {
        document.getElementById('championName').textContent = 'YOU — CHAMPION';
        goto('champion');
      } else {
        document.getElementById('gameOverSub').textContent = 'THE RIVAL TAPPED YOU OUT';
        goto('gameOver');
      }
    } else {
      S.round++;
      document.getElementById('roundEndTitle').textContent = `ROUND ${S.round}`;
      document.getElementById('roundEndSub').textContent = p1Won ? 'YOU TAKE THE ROUND' : 'RIVAL TAKES THE ROUND';
      goto('roundEnd');
    }
  }, 900);
}

export function onTimeUp() {
  const { p1, p2 } = S;
  const winner = p1.hp === p2.hp ? null : (p1.hp > p2.hp ? p1 : p2);
  if (winner) { onKO(winner, winner === p1 ? p2 : p1); }
  else { resetRound(); }
}

export function bindMenus() {
  document.getElementById('btnStart').addEventListener('touchstart', (e) => {
    e.preventDefault(); AUDIO.unlock(); AUDIO.sfx('confirm'); goto('ready');
  }, { passive: false });

  document.getElementById('btnFight').addEventListener('touchstart', (e) => {
    e.preventDefault(); AUDIO.sfx('confirm'); startMatch();
  }, { passive: false });

  document.getElementById('btnNextRound').addEventListener('touchstart', (e) => {
    e.preventDefault(); AUDIO.sfx('confirm'); resetRound(); goto('fight');
  }, { passive: false });

  document.getElementById('btnRematch').addEventListener('touchstart', (e) => {
    e.preventDefault(); AUDIO.sfx('confirm'); startMatch();
  }, { passive: false });

  document.getElementById('btnRetry').addEventListener('touchstart', (e) => {
    e.preventDefault(); AUDIO.sfx('confirm'); startMatch();
  }, { passive: false });

  document.getElementById('btnMainMenu').addEventListener('touchstart', (e) => {
    e.preventDefault(); goto('title');
  }, { passive: false });
  document.getElementById('btnMainMenu2').addEventListener('touchstart', (e) => {
    e.preventDefault(); goto('title');
  }, { passive: false });
}

export const contract = {
  does: "Owns which screen is showing and the rules for moving between screens.",
  owns: "S.scene and menu DOM visibility.",
  needs: "core/state.js, content/fighter.js, ui/hud.js, fx/fx.js, audio/audio.js.",
  inputs: "Button taps on menu screens.",
  outputs: "Scene transitions + updated round/winner state.",
  connectsTo: "Nearly every layer — combat.js calls into it via onKO.",
  helps: "Turns separate screens into one coherent title->champion flow, without a pointless single-option select screen.",
  returns: "Nothing (mutates S.scene + DOM). goto/onKO/onTimeUp/bindMenus.",
  starts: "goto('title') from boot/boot.js.",
  finishes: "When the player wins the match or is tapped out."
};
