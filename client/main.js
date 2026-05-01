import { DEPTHS, HERO_CLASSES, LOOT, MONSTERS, PRISM_DICE, ROOM_TYPES } from "../shared/game-data.js";
import "./styles.css";

const app = document.querySelector("#app");
const dieMap = new Map(PRISM_DICE.map((die) => [die.id, die]));
const saveKey = "scizo-prismatic-depths-v2";

const starterLog = [
  "The gate opens with a soft electric click.",
  "Choose a hero. Roll bright. Press only when your hands want to."
];

let state = loadState() ?? createState();

function createState(heroId = "ironclad") {
  const hero = HERO_CLASSES.find((item) => item.id === heroId) ?? HERO_CLASSES[0];
  return {
    heroId: hero.id,
    hp: hero.hp,
    maxHp: hero.hp,
    depthIndex: 0,
    room: 1,
    monster: createMonster(0, 1),
    roll: [],
    phase: "ready",
    presses: 0,
    bankedXp: 0,
    riskXp: 0,
    focus: 0,
    loot: [],
    safePress: 0,
    message: "Pick your moment, then roll.",
    log: starterLog
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(saveKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(saveKey, JSON.stringify(state));
}

function hero() {
  return HERO_CLASSES.find((item) => item.id === state.heroId) ?? HERO_CLASSES[0];
}

function depth() {
  return DEPTHS[state.depthIndex] ?? DEPTHS[0];
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createMonster(depthIndex, room) {
  const targetTier = room >= 6 ? 3 : Math.min(3, depthIndex + 1 + (room > 3 ? 1 : 0));
  const pool = MONSTERS.filter((monster) => monster.tier <= targetTier);
  const base = randomItem(pool);
  const scale = depthIndex * 3 + Math.floor(room / 2);
  return {
    ...base,
    hp: base.hp + scale,
    maxHp: base.hp + scale,
    attack: base.attack + depthIndex,
    reward: base.reward + scale
  };
}

function currentRoom() {
  if (state.room >= 6) return ROOM_TYPES.find((room) => room.id === "guardian");
  return ROOM_TYPES[(state.room + state.depthIndex) % (ROOM_TYPES.length - 1)];
}

function addLog(entry) {
  state.log = [entry, ...state.log].slice(0, 8);
}

function rollDice(isPress = false) {
  const pool = hero().dicePool;
  state.roll = pool.map((dieId) => dieMap.get(dieId));
  state.roll = state.roll.map(() => dieMap.get(randomItem(pool)));
  state.phase = "rolled";
  if (isPress) {
    state.presses += 1;
    addLog(`Press ${state.presses}: the dice flare and the room leans closer.`);
  } else {
    state.presses = 0;
    addLog(`${hero().name} rolls the PRISM pool.`);
  }
  state.message = isPress ? "New signal acquired. Keep it or press again." : "Keep the roll or press your luck.";
}

function scoreRoll() {
  const lootMods = state.loot.map((name) => LOOT.find((item) => item.name === name)).filter(Boolean);
  let damage = 0;
  let guard = 0;
  let focus = 0;
  let voids = 0;
  const ids = state.roll.map((die) => die.id);

  for (const die of state.roll) {
    damage += die.damage;
    guard += die.guard;
    focus += die.focus;
    if (die.id === "void") voids += 1;

    for (const item of lootMods) {
      if (item.trigger?.includes(die.id)) {
        damage += item.damage ?? 0;
        guard += item.guard ?? 0;
        focus += item.focus ?? 0;
      }
      if (die.id === "void" && item.voidDamage) damage += item.voidDamage;
    }
  }

  const unique = new Set(ids).size;
  const combo = unique >= 4 ? 4 : ids.some((id) => ids.filter((other) => other === id).length >= 3) ? 3 : 0;
  damage += combo;

  if (hero().id === "ironclad" && guard > 0) guard += 2;
  if (hero().id === "shade" && state.presses === 1 && voids === 0) damage += 2;
  if (hero().id === "arcanist" && focus >= 3) damage += 3;
  if (hero().id === "warden" && ids.includes("sol")) state.hp = Math.min(state.maxHp, state.hp + 1);

  return { damage, guard, focus, voids, combo };
}

function resolveRoll() {
  if (!state.roll.length || state.phase !== "rolled") return;
  const result = scoreRoll();
  state.focus += result.focus;
  state.monster.hp = Math.max(0, state.monster.hp - result.damage);
  const counter = Math.max(0, state.monster.attack + state.presses - result.guard);
  state.hp = Math.max(0, state.hp - counter);

  const comboText = result.combo ? ` Combo +${result.combo}.` : "";
  addLog(`You hit for ${result.damage}, guard ${result.guard}, focus +${result.focus}.${comboText}`);

  if (state.monster.hp <= 0) {
    winRoom();
    return;
  }

  if (counter > 0) {
    addLog(`${state.monster.name} answers for ${counter}.`);
  } else {
    addLog("The counterattack sparks against your guard.");
  }

  if (state.hp <= 0) {
    state.phase = "lost";
    state.message = "The descent claims this run. Bank the lesson and go again.";
    addLog("Run lost. The dungeon remembers your shape.");
    return;
  }

  state.phase = "ready";
  state.roll = [];
  state.message = "Room still alive. Roll again.";
}

function winRoom() {
  const gained = Math.ceil(state.monster.reward * depth().xpMultiplier);
  state.riskXp += gained;
  state.phase = "reward";
  state.roll = [];
  state.message = `${state.monster.name} breaks. Claim loot or push onward.`;
  addLog(`Room cleared. ${gained} XP is glowing in the risk pool.`);
}

function pressRoll() {
  if (state.phase !== "rolled") return;
  const hasVoid = state.roll.some((die) => die.id === "void");
  if (hasVoid && state.safePress <= 0) {
    const pain = 2 + state.presses;
    state.hp = Math.max(0, state.hp - pain);
    addLog(`Void backlash bites for ${pain}.`);
  } else if (hasVoid && state.safePress > 0) {
    state.safePress -= 1;
    addLog("Press Token absorbs the void backlash.");
  }

  if (state.hp <= 0) {
    state.phase = "lost";
    state.message = "The press was too bright. Start a new descent.";
    return;
  }

  rollDice(true);
}

function takeLoot() {
  if (state.phase !== "reward") return;
  const owned = new Set(state.loot);
  const choices = LOOT.filter((item) => !owned.has(item.name) || item.type === "Consumable");
  const item = randomItem(choices);
  if (item.heal) state.hp = Math.min(state.maxHp, state.hp + item.heal);
  if (item.safePress) state.safePress += item.safePress;
  if (!item.heal && !item.safePress) state.loot.push(item.name);
  addLog(`Loot: ${item.name}. ${item.text}`);
  nextRoom();
}

function bankXp() {
  if (state.riskXp <= 0) {
    state.message = "No loose XP to bank yet.";
    return;
  }
  state.bankedXp += state.riskXp;
  addLog(`Banked ${state.riskXp} XP. Smart. Clean. Human.`);
  state.riskXp = 0;
  state.hp = Math.min(state.maxHp, state.hp + 2);
  state.message = "XP banked. You catch your breath.";
  saveAndRender();
}

function nextRoom() {
  if (state.room >= 6) {
    if (state.depthIndex >= DEPTHS.length - 1) {
      state.phase = "won";
      state.bankedXp += state.riskXp;
      state.riskXp = 0;
      state.message = "You reached the bottom and came back with the light.";
      addLog("Victory. PRISMATIC DEPTHS clears around you.");
      saveAndRender();
      return;
    }
    state.depthIndex += 1;
    state.room = 1;
    addLog(`${depth().label} opens. The colors get sharper.`);
  } else {
    state.room += 1;
  }
  state.monster = createMonster(state.depthIndex, state.room);
  state.phase = "ready";
  state.roll = [];
  state.presses = 0;
  state.message = `${currentRoom().name}: ${currentRoom().mood}`;
  saveAndRender();
}

function changeHero(heroId) {
  state = createState(heroId);
  addLog(`${hero().name} steps into the gate.`);
  saveAndRender();
}

function newRun() {
  state = createState(state.heroId);
  saveAndRender();
}

function saveAndRender() {
  saveState();
  render();
}

function percent(value, max) {
  return `${Math.max(0, Math.min(100, Math.round((value / max) * 100)))}%`;
}

function renderDice() {
  if (!state.roll.length) return `<div class="empty-roll">Roll to wake the PRISM dice.</div>`;
  return state.roll
    .map((die) => `<div class="die die--${die.id}"><strong>${die.icon}</strong><span>${die.label}</span></div>`)
    .join("");
}

function renderLoot() {
  if (!state.loot.length && !state.safePress) return `<p class="muted">No loot yet. The dungeon is being coy.</p>`;
  const permanent = state.loot.map((name) => {
    const item = LOOT.find((entry) => entry.name === name);
    return `<li><strong>${item.name}</strong><span>${item.text}</span></li>`;
  });
  if (state.safePress) permanent.push(`<li><strong>Press Token</strong><span>${state.safePress} safe press stored.</span></li>`);
  return `<ul class="loot-list">${permanent.join("")}</ul>`;
}

function render() {
  const activeHero = hero();
  const room = currentRoom();
  const monster = state.monster;
  const gameOver = state.phase === "lost" || state.phase === "won";

  app.innerHTML = `
    <section class="game-hero">
      <div>
        <p class="eyebrow">Scizo Engine / PRISMATIC DEPTHS</p>
        <h1>Press your luck. Split the signal. Descend.</h1>
        <p>${state.message}</p>
      </div>
      <div class="status-card">
        <span>${depth().label} / Room ${state.room}</span>
        <strong>${room.name}</strong>
        <p>${room.mood}</p>
      </div>
    </section>

    <section class="hero-select" aria-label="Choose hero">
      ${HERO_CLASSES.map((item) => `
        <button class="hero-card ${item.id === state.heroId ? "is-active" : ""}" data-action="hero" data-hero="${item.id}">
          <span>${item.role}</span>
          <strong>${item.name}</strong>
          <p>${item.gift}</p>
        </button>
      `).join("")}
    </section>

    <section class="game-board">
      <article class="panel hero-panel">
        <div class="panel-head">
          <span>Your Hero</span>
          <strong>${activeHero.name}</strong>
        </div>
        <div class="meter">
          <div><span>HP</span><b>${state.hp}/${state.maxHp}</b></div>
          <div class="rail"><i style="width:${percent(state.hp, state.maxHp)}"></i></div>
        </div>
        <div class="stat-grid">
          <div><span>Banked XP</span><strong>${state.bankedXp}</strong></div>
          <div><span>Risk XP</span><strong>${state.riskXp}</strong></div>
          <div><span>Focus</span><strong>${state.focus}</strong></div>
        </div>
        <div class="loot-box">
          <h2>Loot</h2>
          ${renderLoot()}
        </div>
      </article>

      <article class="panel fight-panel">
        <div class="panel-head">
          <span>${monster.quirk}</span>
          <strong>${monster.name}</strong>
        </div>
        <div class="monster-frame">
          <div class="monster-sigil" aria-hidden="true">${monster.tier}</div>
          <div class="meter">
            <div><span>Threat HP</span><b>${monster.hp}/${monster.maxHp}</b></div>
            <div class="rail rail--danger"><i style="width:${percent(monster.hp, monster.maxHp)}"></i></div>
          </div>
          <p>Attack ${monster.attack} / Reward ${Math.ceil(monster.reward * depth().xpMultiplier)} XP</p>
        </div>
        <div class="dice-tray">${renderDice()}</div>
        <div class="command-row">
          <button data-action="roll" ${state.phase !== "ready" ? "disabled" : ""}>Roll</button>
          <button data-action="press" ${state.phase !== "rolled" ? "disabled" : ""}>Press</button>
          <button data-action="keep" ${state.phase !== "rolled" ? "disabled" : ""}>Keep & Resolve</button>
          <button data-action="loot" ${state.phase !== "reward" ? "disabled" : ""}>Claim Loot + Next</button>
          <button data-action="bank" ${state.riskXp <= 0 || gameOver ? "disabled" : ""}>Bank XP</button>
          <button data-action="new">New Run</button>
        </div>
      </article>

      <article class="panel log-panel">
        <div class="panel-head">
          <span>Last Signals</span>
          <strong>Run Log</strong>
        </div>
        <div class="event-log">
          ${state.log.map((entry) => `<p>${entry}</p>`).join("")}
        </div>
      </article>
    </section>
  `;
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "hero") changeHero(target.dataset.hero);
  if (action === "roll") {
    rollDice();
    saveAndRender();
  }
  if (action === "press") {
    pressRoll();
    saveAndRender();
  }
  if (action === "keep") {
    resolveRoll();
    saveAndRender();
  }
  if (action === "loot") takeLoot();
  if (action === "bank") bankXp();
  if (action === "new") newRun();
});

render();
