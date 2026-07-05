/*
CONTRACT — src/render/render.js (Render Layer)
1. does:        Draws the current frame: arena backdrop, both sprite-based fighters, active FX.
2. owns:        The 2D canvas context, draw order, and the per-combatant animation-frame cursor
                 (advancing clipFrame/clipTimer based on combatant.state).
3. needs:       core/state.js S.p1/p2, content/spriteAtlas.js (image + CLIPS + frameRect), fx.active.
4. inputs:      Current S and FX.active, read-only; combatant.state as the CLIPS lookup key.
5. outputs:     Pixels on <canvas id="screen">, drawn from the real pixel-art sprite sheet.
6. connectsTo:  core/state.js, content/spriteAtlas.js, content/fighter.js (tint), fx/fx.js.
7. helps:       Gives the fight its real visual identity from the uploaded sprite sheet instead
                 of the emoji placeholder used in the previous single-file/modular builds.
8. returns:     Nothing — direct canvas draw calls. frame() is the named export.
9. starts:      frame() called once per rAF tick while scene === 'fight', once atlas.ready resolves.
10. finishes:   Each call finishes when the frame is fully painted.
*/

import { S } from '../core/state.js';
import { active as fxActive } from '../fx/fx.js';
import { image as atlasImage, frameRect, CLIPS, ready as atlasReady } from '../content/spriteAtlas.js';

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const CLIP_FRAME_DURATION = 0.12; // seconds per sprite frame within a clip

let atlasLoaded = false;
atlasReady.then(() => { atlasLoaded = true; }).catch(() => { atlasLoaded = false; });

function arena() {
  ctx.fillStyle = '#060e0a'; ctx.fillRect(0, 0, 350, 550);
  const grad = ctx.createLinearGradient(0, 0, 0, 460);
  grad.addColorStop(0, '#0c1a12'); grad.addColorStop(1, '#020504');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 350, 460);
  ctx.fillStyle = '#020806'; ctx.fillRect(0, 430, 350, 120);
  ctx.strokeStyle = '#39ff8c22'; ctx.lineWidth = 1;
  for (let i = 0; i < 350; i += 25) { ctx.beginPath(); ctx.moveTo(i, 430); ctx.lineTo(i - 40, 500); ctx.stroke(); }
}

function advanceClip(c, dt) {
  const clip = CLIPS[c.state] || CLIPS.idle;
  c.clipTimer += dt;
  if (c.clipTimer >= CLIP_FRAME_DURATION) {
    c.clipTimer = 0;
    c.clipFrame = (c.clipFrame + 1) % clip.length;
  }
  if (c.clipFrame >= clip.length) c.clipFrame = 0;
  return clip[c.clipFrame];
}

function fighter(c, dt) {
  if (!c) return;

  if (!atlasLoaded) {
    // Fallback while the sheet loads: a simple placeholder box so the scene isn't blank.
    ctx.save();
    ctx.fillStyle = c.def.tint ? '#5ad1ff' : '#ff8a5a';
    ctx.fillRect(c.x - 16, c.y - 56, 32, 56);
    ctx.restore();
    return;
  }

  const [row, col] = advanceClip(c, dt);
  const [sx, sy, sw, sh] = frameRect(row, col);

  ctx.save();
  if (c.def.tint) ctx.filter = c.def.tint;
  if (c.hitstun > 0) ctx.filter = (c.def.tint ? c.def.tint + ' ' : '') + 'brightness(1.8) saturate(0.4)';

  ctx.translate(c.x, c.y);
  // Sheet faces right by default; mirror when facing left.
  const mirror = c.facing === -1;
  if (mirror) ctx.scale(-1, 1);

  const drawScale = 0.9;
  const dw = sw * drawScale, dh = sh * drawScale;
  ctx.drawImage(atlasImage, sx, sy, sw, sh, -dw / 2, -dh + 10, dw, dh);

  ctx.filter = 'none';
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(c.x, 428, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fxLayer() {
  for (const f of fxActive) {
    if (f.type === 'spark') {
      const a = f.ttl / f.maxTtl;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#eaffea';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const r = 14 * (1 - a) + 6;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (f.type === 'combo') {
      const a = f.ttl / f.maxTtl;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffdd55';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, 175, 200 - (1 - a) * 20);
      ctx.restore();
    }
  }
}

let lastFrameTs = 0;
export function frame(dtOverride) {
  const dt = typeof dtOverride === 'number' ? dtOverride : 0.016;
  arena();
  const { p1, p2 } = S;
  const order = p1 && p2 ? (p1.y <= p2.y ? [p1, p2] : [p2, p1]) : [];
  for (const c of order) fighter(c, dt);
  fxLayer();
  S.frame++;
}

export const contract = {
  does: "Paints the current fight frame to the canvas using real sprite frames.",
  owns: "The 2D drawing context, draw order, and per-combatant clip-frame cursor.",
  needs: "state.S.p1/p2, spriteAtlas.image/CLIPS/frameRect, fx.active.",
  inputs: "Read-only state each frame, plus dt for animation timing.",
  outputs: "Pixels on #screen canvas, sourced from assets/fighter_sheet.png.",
  connectsTo: "core/state.js, content/spriteAtlas.js, fx/fx.js.",
  helps: "Gives the fight its real pixel-art visual identity instead of emoji placeholders.",
  returns: "Nothing (direct canvas draw). frame(dt) is the export.",
  starts: "frame(dt) each rAF tick in fight scene, once the atlas image has loaded.",
  finishes: "When the frame is fully painted."
};
