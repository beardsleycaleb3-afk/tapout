/*
CONTRACT — src/input/input.js (Input Layer)
1. does:        Reads raw touch events and turns them into a normalized intent object.
2. owns:        The virtual joystick vector and the 4 action-button pressed states.
3. needs:       DOM elements #stick, #btnPunch/#btnKick/#btnBlock/#btnSpecial (from index.html).
4. inputs:      touchstart/touchmove/touchend on those DOM elements.
5. outputs:     `intent` object { moveX, punch, kick, block, special }, exported live.
6. connectsTo:  combat/combat.js (reads action flags), movement/movement.js (reads moveX).
7. helps:       Decouples raw browser touch quirks from gameplay logic.
8. returns:     intent (object), bind() — named exports.
9. starts:      bind() called once during boot.
10. finishes:   Never — listeners persist for the app's lifetime.
*/

export const intent = { moveX: 0, punch: false, kick: false, block: false, special: false };
let stickId = null, stickOriginX = 0;

export function bind() {
  const stick = document.getElementById('stick');
  const nub = document.getElementById('stickNub');

  stick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    stickId = t.identifier;
    const rect = stick.getBoundingClientRect();
    stickOriginX = rect.left + rect.width / 2;
  }, { passive: false });

  stick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== stickId) continue;
      let dx = t.clientX - stickOriginX;
      dx = Math.max(-30, Math.min(30, dx));
      nub.style.transform = `translateX(${dx}px)`;
      intent.moveX = dx / 30;
    }
  }, { passive: false });

  const release = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== stickId) continue;
      stickId = null; intent.moveX = 0;
      nub.style.transform = 'translateX(0px)';
    }
  };
  stick.addEventListener('touchend', release, { passive: false });
  stick.addEventListener('touchcancel', release, { passive: false });

  bindButton('btnPunch', (v) => intent.punch = v);
  bindButton('btnKick', (v) => intent.kick = v);
  bindButton('btnBlock', (v) => intent.block = v);
  bindButton('btnSpecial', (v) => intent.special = v);
}

function bindButton(id, setter) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', (e) => {
    e.preventDefault(); el.classList.add('pressed'); setter(true);
  }, { passive: false });
  const up = (e) => { e.preventDefault(); el.classList.remove('pressed'); setter(false); };
  el.addEventListener('touchend', up, { passive: false });
  el.addEventListener('touchcancel', up, { passive: false });
}

export const contract = {
  does: "Captures touch input and normalizes it into an intent object.",
  owns: "intent{moveX,punch,kick,block,special}, joystick DOM feedback.",
  needs: "#stick and 4 #btn* elements present in the DOM.",
  inputs: "touchstart/touchmove/touchend/touchcancel.",
  outputs: "The live `intent` export, continuously updated.",
  connectsTo: "combat/combat.js, movement/movement.js.",
  helps: "Isolates browser touch quirks from gameplay logic.",
  returns: "intent object, bind() function.",
  starts: "bind() called during boot.",
  finishes: "Never unbinds during the app session."
};
