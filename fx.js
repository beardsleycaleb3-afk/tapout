/*
CONTRACT — src/fx/fx.js (FX Layer)
1. does:        Tracks short-lived visual events for render.js to draw and expire.
2. owns:        A list of active FX entries (sparks, banners, combo text).
3. needs:       Nothing external — pure timers plus one DOM element (#flashBanner) for banner text.
4. inputs:      Calls like hitSpark(x,y), flashBanner(text), comboPop(n).
5. outputs:     `active` array read by render/render.js each frame.
6. connectsTo:  combat/combat.js (triggers), render/render.js (consumes), scenes/scenes.js (banners like round wins).
7. helps:       Gives the fight visual juice without coupling combat math to canvas code.
8. returns:     active[] and hitSpark/comboPop/flashBanner/bigBanner/step — named exports.
9. starts:      An entry starts the instant it's pushed to `active`.
10. finishes:   Each entry finishes (is removed) when its ttl reaches 0 in step(dt).
*/

export const active = [];

export function hitSpark(x, y) { active.push({ type: 'spark', x, y, ttl: 0.18, maxTtl: 0.18 }); }
export function comboPop(n) { active.push({ type: 'combo', text: `${n} HIT`, ttl: 0.6, maxTtl: 0.6 }); }

export function flashBanner(text) {
  const el = document.getElementById('flashBanner');
  el.textContent = text; el.style.display = 'block';
  el.style.opacity = '1';
  active.push({ type: 'banner', el, ttl: 0.9, maxTtl: 0.9 });
}

export function bigBanner(text, ms) {
  const el = document.getElementById('flashBanner');
  el.textContent = text; el.style.display = 'block'; el.style.opacity = '1';
  setTimeout(() => { el.style.display = 'none'; }, ms || 1200);
}

export function step(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const f = active[i];
    f.ttl -= dt;
    if (f.type === 'banner' && f.el) f.el.style.opacity = String(Math.max(0, f.ttl / f.maxTtl));
    if (f.ttl <= 0) {
      if (f.type === 'banner' && f.el) f.el.style.display = 'none';
      active.splice(i, 1);
    }
  }
}

export const contract = {
  does: "Tracks and expires transient visual feedback events.",
  owns: "The active[] FX list.",
  needs: "#flashBanner DOM element for banner-type entries.",
  inputs: "hitSpark/comboPop/flashBanner/bigBanner calls.",
  outputs: "active[] consumed by render/render.js each frame.",
  connectsTo: "combat/combat.js, render/render.js, scenes/scenes.js.",
  helps: "Adds arcade juice without coupling combat math to canvas drawing.",
  returns: "active array, hitSpark(), comboPop(), flashBanner(), bigBanner(), step(dt).",
  starts: "When an entry is pushed.",
  finishes: "When ttl<=0 in step(dt)."
};
