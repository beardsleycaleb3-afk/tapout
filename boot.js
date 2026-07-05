const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');

const titleOverlay = document.getElementById('titleOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const hud = document.getElementById('hud');
const controls = document.getElementById('controls');
const p1Bar = document.getElementById('p1Bar');
const p2Bar = document.getElementById('p2Bar');
const statusText = document.getElementById('statusText');
const timerText = document.getElementById('timerText');
const comboText = document.getElementById('comboText');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const stick = document.getElementById('stick');
const stickNub = document.getElementById('stickNub');

const buttons = ['btnPunch', 'btnKick', 'btnBlock', 'btnSpecial'];
const inputState = { moveX: 0, punch: false, kick: false, block: false, special: false };
const state = {
  scene: 'title',
  player: null,
  enemy: null,
  lastTs: 0,
  activeTouchId: null,
  stickOriginX: 0,
  stickOriginY: 0,
  flashText: '',
  flashTimer: 0,
  roundTimer: 99,
  round: 1,
  roundWins: [0, 0],
  transitionTimer: 0
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createFighter(x, side) {
  return {
    x,
    y: 400,
    hp: 100,
    maxHp: 100,
    side,
    attackTimer: 0,
    hitFlash: 0,
    blocking: false,
    dir: side === 1 ? 1 : -1,
      attackCooldown: 0,
    combo: 0,
    comboTimer: 0
  };
}

function hideOverlay() {
  resultOverlay.classList.add('hidden');
}

function showOverlay(title, text) {
  resultTitle.textContent = title;
  resultText.textContent = text;
  resultOverlay.classList.remove('hidden');
  hud.classList.add('hidden');
  controls.classList.add('hidden');
}

function startRound() {
  state.player = createFighter(90, 1);
  state.enemy = createFighter(260, -1);
  state.scene = 'fight';
  state.lastTs = 0;
  inputState.moveX = 0;
  inputState.punch = false;
  inputState.kick = false;
  inputState.block = false;
  inputState.special = false;
  state.flashText = `ROUND ${state.round}`;
  state.flashTimer = 0.8;
  state.roundTimer = 99;
  state.transitionTimer = 0;
  titleOverlay.classList.add('hidden');
  hideOverlay();
  hud.classList.remove('hidden');
  controls.classList.remove('hidden');
}

function resetMatch() {
  state.round = 1;
  state.roundWins = [0, 0];
  startRound();
}

function showResult(title, text) {
  state.scene = 'result';
  showOverlay(title, text);
}

function showRoundTransition(winnerSide) {
  state.scene = 'transition';
  state.transitionTimer = 1.3;
  const playerWon = winnerSide === 1;
  if (playerWon) state.roundWins[0] += 1; else state.roundWins[1] += 1;
  if (state.roundWins[0] >= 2 || state.roundWins[1] >= 2) {
    showResult(playerWon ? 'YOU WIN' : 'RIVAL WINS', 'MATCH COMPLETE — TAP TO PLAY AGAIN');
    return;
  }
  state.round += 1;
  showOverlay(`ROUND ${state.round}`, `${playerWon ? 'YOU' : 'RIVAL'} TAKES THE ROUND`);
}

function applyAttack(attacker, target, damage, kind) {
  if (target.blocking) {
    target.hp = Math.max(0, target.hp - Math.floor(damage / 2));
  } else {
    target.hp = Math.max(0, target.hp - damage);
  }
  target.hitFlash = 0.16;
  target.x += attacker.dir * 10;
  state.flashText = kind.toUpperCase();
  state.flashTimer = 0.45;

  attacker.combo = (attacker.combo || 0) + 1;
  attacker.comboTimer = 1.2;
  target.combo = 0;
  target.comboTimer = 0;

  if (target.hp <= 0) {
    showRoundTransition(attacker === state.player ? 1 : -1);
  }
}

function bindInput() {
  stick.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const touch = event.changedTouches[0];
    state.activeTouchId = touch.identifier;
    const rect = stick.getBoundingClientRect();
    state.stickOriginX = rect.left + rect.width / 2;
    state.stickOriginY = rect.top + rect.height / 2;
  }, { passive: false });

  stick.addEventListener('touchmove', (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (touch.identifier !== state.activeTouchId) continue;
      const dx = clamp(touch.clientX - state.stickOriginX, -34, 34);
      const moveX = dx / 34;
      inputState.moveX = moveX;
      stickNub.style.transform = `translate(${dx}px, 0)`;
    }
  }, { passive: false });

  const releaseStick = (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === state.activeTouchId) {
        state.activeTouchId = null;
        inputState.moveX = 0;
        stickNub.style.transform = 'translate(0px, 0px)';
      }
    }
  };
  stick.addEventListener('touchend', releaseStick, { passive: false });
  stick.addEventListener('touchcancel', releaseStick, { passive: false });

  for (const id of buttons) {
    const el = document.getElementById(id);
    const setPressed = (pressed) => {
      if (id === 'btnPunch') inputState.punch = pressed;
      if (id === 'btnKick') inputState.kick = pressed;
      if (id === 'btnBlock') inputState.block = pressed;
      if (id === 'btnSpecial') inputState.special = pressed;
      el.classList.toggle('pressed', pressed);
    };
    el.addEventListener('touchstart', (event) => {
      event.preventDefault();
      setPressed(true);
    }, { passive: false });
    el.addEventListener('touchend', (event) => {
      event.preventDefault();
      setPressed(false);
    }, { passive: false });
    el.addEventListener('touchcancel', (event) => {
      event.preventDefault();
      setPressed(false);
    }, { passive: false });
  }

  document.getElementById('startBtn').addEventListener('touchstart', (event) => {
    event.preventDefault();
    document.getElementById('startBtn').classList.add('pressed');
  }, { passive: false });
  document.getElementById('startBtn').addEventListener('touchend', (event) => {
    event.preventDefault();
    document.getElementById('startBtn').classList.remove('pressed');
    resetMatch();
  }, { passive: false });

  document.getElementById('retryBtn').addEventListener('touchstart', (event) => {
    event.preventDefault();
    document.getElementById('retryBtn').classList.add('pressed');
  }, { passive: false });
  document.getElementById('retryBtn').addEventListener('touchend', (event) => {
    event.preventDefault();
    document.getElementById('retryBtn').classList.remove('pressed');
    resetMatch();
  }, { passive: false });
}

function updateHud() {
  if (!state.player || !state.enemy) return;
  p1Bar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
  p2Bar.style.width = `${(state.enemy.hp / state.enemy.maxHp) * 100}%`;
  timerText.textContent = `TIME ${Math.max(0, Math.ceil(state.roundTimer))}`;
  comboText.textContent = `COMBO ${state.player.combo || 0}`;
  if (state.scene === 'fight') {
    statusText.textContent = state.flashTimer > 0 ? state.flashText : (inputState.block ? 'BLOCKING' : 'READY');
  }
}

function drawArena() {
  ctx.fillStyle = '#060e0a';
  ctx.fillRect(0, 0, 350, 550);
  const grad = ctx.createLinearGradient(0, 0, 0, 420);
  grad.addColorStop(0, '#0c1a12');
  grad.addColorStop(1, '#020504');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 350, 430);
  ctx.fillStyle = '#020806';
  ctx.fillRect(0, 430, 350, 120);
  ctx.strokeStyle = 'rgba(57,255,140,0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 350; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 430);
    ctx.lineTo(x - 24, 500);
    ctx.stroke();
  }
}

function drawFighter(fighter) {
  const baseY = 400;
  fighter.hitFlash = Math.max(0, fighter.hitFlash - 0.016);
  fighter.attackTimer = Math.max(0, fighter.attackTimer - 0.016);
  fighter.attackCooldown = Math.max(0, fighter.attackCooldown - 0.016);

  ctx.save();
  ctx.translate(fighter.x, baseY - 30);
  if (fighter.hitFlash > 0) {
    ctx.fillStyle = '#fff';
  } else if (fighter.side === 1) {
    ctx.fillStyle = '#39ff8c';
  } else {
    ctx.fillStyle = '#ff8a3b';
  }

  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(-16, -50, 32, 48);
  ctx.fillStyle = '#0e1110';
  ctx.fillRect(-10, -40, 20, 16);
  ctx.fillStyle = fighter.side === 1 ? '#39ff8c' : '#ff8a3b';
  ctx.fillRect(-12, -34, 24, 24);

  if (fighter.attackTimer > 0) {
    ctx.fillStyle = '#eaffea';
    ctx.fillRect(fighter.side === 1 ? 12 : -24, -28, fighter.side === 1 ? 16 : 16, 6);
  }
  ctx.restore();
}

function draw() {
  drawArena();
  if (state.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.18 + state.flashTimer * 0.2;
    ctx.fillStyle = '#eaffea';
    ctx.fillRect(0, 0, 350, 550);
    ctx.restore();
  }
  if (state.player) drawFighter(state.player);
  if (state.enemy) drawFighter(state.enemy);
}

function step(dt) {
  if (state.scene === 'transition') {
    state.transitionTimer = Math.max(0, state.transitionTimer - dt);
    if (state.transitionTimer <= 0) {
      startRound();
    }
    return;
  }

  if (state.scene !== 'fight' || !state.player || !state.enemy) return;

  state.flashTimer = Math.max(0, state.flashTimer - dt);
  state.roundTimer = Math.max(0, state.roundTimer - dt);
  const player = state.player;
  const enemy = state.enemy;

  player.comboTimer = Math.max(0, player.comboTimer - dt);
  enemy.comboTimer = Math.max(0, enemy.comboTimer - dt);
  if (player.comboTimer <= 0) player.combo = 0;
  if (enemy.comboTimer <= 0) enemy.combo = 0;

  player.x += inputState.moveX * 120 * dt;
  player.x = clamp(player.x, 42, 140);
  player.blocking = inputState.block;

  const distance = Math.abs(player.x - enemy.x);
  if (distance > 86) {
    enemy.x += (player.x > enemy.x ? 1 : -1) * 82 * dt;
  } else if (distance > 64) {
    enemy.x += (player.x > enemy.x ? 1 : -1) * 36 * dt;
  } else {
    enemy.x += (player.x > enemy.x ? 1 : -1) * 16 * dt;
  }
  enemy.x = clamp(enemy.x, 210, 308);

  if (inputState.punch && player.attackCooldown <= 0) {
    player.attackTimer = 0.2;
    player.attackCooldown = 0.4;
    if (distance < 70) {
      applyAttack(player, enemy, 16, 'punch');
    }
  }
  if (inputState.kick && player.attackCooldown <= 0) {
    player.attackTimer = 0.25;
    player.attackCooldown = 0.5;
    if (distance < 80) {
      applyAttack(player, enemy, 22, 'kick');
    }
  }
  if (inputState.special && player.attackCooldown <= 0) {
    player.attackTimer = 0.3;
    player.attackCooldown = 0.7;
    if (distance < 90) {
      applyAttack(player, enemy, 28, 'special');
    }
  }

  if (enemy.attackCooldown <= 0 && distance < 80) {
    enemy.attackTimer = 0.2;
    enemy.attackCooldown = 0.8;
    if (!player.blocking) {
      applyAttack(enemy, player, 14, 'rival');
    }
  }

  updateHud();
}

function loop(timestamp) {
  const dt = Math.min(0.05, (timestamp - state.lastTs) / 1000 || 0.016);
  state.lastTs = timestamp;
  step(dt);
  draw();
  requestAnimationFrame(loop);
}

bindInput();
requestAnimationFrame(loop);
