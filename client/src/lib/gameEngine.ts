// ============================================================
// PRISMATIC DEPTHS — Core Game Engine
// Design: Neon Dungeon Terminal — all game logic lives here
// ============================================================

export type DieType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20';
export type HeroClass = 'Ironclad' | 'Shade' | 'Arcanist' | 'Warden';
export type GamePhase = 'hero-select' | 'dungeon' | 'combat' | 'loot' | 'game-over' | 'victory';
export type RoomType = 'entrance' | 'ambush' | 'monster-lair' | 'guarded-room' | 'trapped-passage' | 'treasure-room' | 'shrine' | 'prismatic-vault' | 'stairway' | 'safe-room';
export type MonsterTier = 1 | 2 | 3;
export type Depth = 1 | 2 | 3;
export type CombatPhase = 'player-turn' | 'monster-turn' | 'resolving';
export type LootSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';

// ─── DIE DEFINITIONS ──────────────────────────────────────────
export const DIE_CONFIG: Record<DieType, { sides: number; crownHits: number; color: string; neonClass: string }> = {
  D4:  { sides: 4,  crownHits: 1, color: '#a855f7', neonClass: 'neon-violet' },
  D6:  { sides: 6,  crownHits: 2, color: '#3b82f6', neonClass: 'neon-blue'   },
  D8:  { sides: 8,  crownHits: 2, color: '#06b6d4', neonClass: 'neon-cyan'   },
  D10: { sides: 10, crownHits: 3, color: '#22c55e', neonClass: 'neon-green'  },
  D12: { sides: 12, crownHits: 3, color: '#f59e0b', neonClass: 'neon-amber'  },
  D20: { sides: 20, crownHits: 5, color: '#ef4444', neonClass: 'neon-crimson'},
};

export function rollDie(type: DieType): number {
  return Math.floor(Math.random() * DIE_CONFIG[type].sides) + 1;
}

export function scoreDie(type: DieType, value: number): { result: 'ace' | 'crown' | 'miss'; hits: number } {
  if (value === 1) return { result: 'ace', hits: 1 };
  if (value === DIE_CONFIG[type].sides) return { result: 'crown', hits: DIE_CONFIG[type].crownHits };
  return { result: 'miss', hits: 0 };
}

export interface DieRoll {
  type: DieType;
  value: number;
  result: 'ace' | 'crown' | 'miss';
  hits: number;
  setAside: boolean;
}

export function rollDice(types: DieType[]): DieRoll[] {
  return types.map(type => {
    const value = rollDie(type);
    const { result, hits } = scoreDie(type, value);
    return { type, value, result, hits, setAside: false };
  });
}

export function checkComboBonuses(rolls: DieRoll[]): { tripleStrike: boolean; precisionStrike: boolean; fullSpectrum: boolean; bonusHits: number; ignoreDefense: boolean; doubleHits: boolean; extraAction: boolean } {
  const scoringRolls = rolls.filter(r => r.result !== 'miss');
  const allValues = rolls.map(r => r.value).sort((a, b) => a - b);
  const scoringValues = scoringRolls.map(r => r.value);

  // Triple Strike: 3+ dice show same number
  const valueCounts: Record<number, number> = {};
  allValues.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });
  const tripleStrike = Object.values(valueCounts).some(c => c >= 3);

  // Precision Strike: 4+ consecutive values
  let precisionStrike = false;
  if (allValues.length >= 4) {
    for (let i = 0; i <= allValues.length - 4; i++) {
      let consecutive = true;
      for (let j = 1; j < 4; j++) {
        if (allValues[i + j] !== allValues[i] + j) { consecutive = false; break; }
      }
      if (consecutive) { precisionStrike = true; break; }
    }
  }

  // Full Spectrum: all 6 dice score
  const fullSpectrum = rolls.length === 6 && rolls.every(r => r.result !== 'miss');

  let bonusHits = 0;
  if (tripleStrike) bonusHits += 3;

  return {
    tripleStrike,
    precisionStrike,
    fullSpectrum,
    bonusHits,
    ignoreDefense: precisionStrike,
    doubleHits: fullSpectrum,
    extraAction: fullSpectrum,
  };
}

// ─── HERO DEFINITIONS ─────────────────────────────────────────
export interface HeroStats {
  class: HeroClass;
  name: string;
  role: string;
  maxHp: number;
  hp: number;
  weaponDice: DieType[];
  armorDice: DieType[];
  reserveDice: DieType[];
  baseMovement: number;
  xp: number;
  bankedXp: number;
  level: number;
  inventory: LootItem[];
  statusEffects: StatusEffect[];
  blessingTokens: number;
  specialUsed: boolean; // once per room
  level3AbilityUsed: boolean; // once per delve
  isDown: boolean;
  // Upgrades from loot
  vorpalEdge: boolean;
  cursedBlade: boolean;
  shadowCloak: boolean;
  mirrorShieldUsed: boolean;
  aegisCharmUsed: boolean;
  prismaticBladeUsed: boolean;
  throwingKnives: boolean;
}

export interface StatusEffect {
  type: 'webbed' | 'cursed' | 'blessed';
  roundsLeft: number;
}

export const HERO_TEMPLATES: Record<HeroClass, Omit<HeroStats, 'xp' | 'bankedXp' | 'level' | 'inventory' | 'statusEffects' | 'blessingTokens' | 'specialUsed' | 'level3AbilityUsed' | 'isDown' | 'vorpalEdge' | 'cursedBlade' | 'shadowCloak' | 'mirrorShieldUsed' | 'aegisCharmUsed' | 'prismaticBladeUsed' | 'throwingKnives'>> = {
  Ironclad: {
    class: 'Ironclad', name: 'Ironclad', role: 'Tank / Warrior',
    maxHp: 12, hp: 12,
    weaponDice: ['D6', 'D8'],
    armorDice: ['D4', 'D10'],
    reserveDice: ['D12', 'D20'],
    baseMovement: 3,
  },
  Shade: {
    class: 'Shade', name: 'Shade', role: 'Rogue / Assassin',
    maxHp: 8, hp: 8,
    weaponDice: ['D4', 'D6', 'D8'],
    armorDice: ['D10'],
    reserveDice: ['D12', 'D20'],
    baseMovement: 4,
  },
  Arcanist: {
    class: 'Arcanist', name: 'Arcanist', role: 'Mage / Sorcerer',
    maxHp: 6, hp: 6,
    weaponDice: ['D6'],
    armorDice: [],
    reserveDice: ['D4', 'D8', 'D10', 'D12', 'D20'],
    baseMovement: 3,
  },
  Warden: {
    class: 'Warden', name: 'Warden', role: 'Cleric / Ranger',
    maxHp: 10, hp: 10,
    weaponDice: ['D8', 'D10'],
    armorDice: ['D4', 'D6'],
    reserveDice: ['D12', 'D20'],
    baseMovement: 3,
  },
};

export function createHero(heroClass: HeroClass): HeroStats {
  const template = HERO_TEMPLATES[heroClass];
  return {
    ...template,
    xp: 0,
    bankedXp: 0,
    level: 1,
    inventory: [],
    statusEffects: [],
    blessingTokens: 0,
    specialUsed: false,
    level3AbilityUsed: false,
    isDown: false,
    vorpalEdge: false,
    cursedBlade: false,
    shadowCloak: false,
    mirrorShieldUsed: false,
    aegisCharmUsed: false,
    prismaticBladeUsed: false,
    throwingKnives: false,
  };
}

// ─── MONSTER DEFINITIONS ──────────────────────────────────────
export interface Monster {
  id: string;
  name: string;
  tier: MonsterTier;
  maxHp: number;
  hp: number;
  attackDice: DieType[];
  defense: number;
  xp: number;
  special: string;
  specialType: 'swarm' | 'cowardly' | 'brittle' | 'web' | 'ritual' | 'brutal' | 'regenerate' | 'incorporeal' | 'surprise' | 'curse' | 'riposte' | 'breath' | 'phylactery' | 'none';
  roundsAlive: number;
  phylacteryUsed?: boolean;
}

export const MONSTER_TEMPLATES: Omit<Monster, 'id' | 'hp' | 'roundsAlive' | 'phylacteryUsed'>[] = [
  // Tier 1
  { name: 'Giant Rat',       tier: 1, maxHp: 1,  attackDice: ['D4'],         defense: 0, xp: 5,   special: 'Swarm: If 3+ Rats present, each rolls extra D4', specialType: 'swarm' },
  { name: 'Goblin',          tier: 1, maxHp: 2,  attackDice: ['D4', 'D6'],   defense: 0, xp: 10,  special: 'Cowardly: On damage, flees on D6 Crown', specialType: 'cowardly' },
  { name: 'Skeleton Warrior',tier: 1, maxHp: 3,  attackDice: ['D6', 'D8'],   defense: 1, xp: 15,  special: 'Brittle: Crown Hits deal +1 damage', specialType: 'brittle' },
  { name: 'Giant Spider',    tier: 1, maxHp: 3,  attackDice: ['D6', 'D6'],   defense: 0, xp: 15,  special: 'Web: Crown attack reduces hero movement to 1 for 1 round', specialType: 'web' },
  { name: 'Cultist',         tier: 1, maxHp: 2,  attackDice: ['D8'],         defense: 0, xp: 10,  special: 'Dark Ritual: Summons monster if alive after 2 rounds', specialType: 'ritual' },
  // Tier 2
  { name: 'Orc Warrior',     tier: 2, maxHp: 5,  attackDice: ['D8', 'D10'],  defense: 1, xp: 30,  special: 'Brutal: 3+ damage in one hit knocks back 1 square', specialType: 'brutal' },
  { name: 'Cave Troll',      tier: 2, maxHp: 8,  attackDice: ['D10', 'D12'], defense: 2, xp: 50,  special: 'Regenerate: Heals 1 HP at start of each monster phase', specialType: 'regenerate' },
  { name: 'Wraith',          tier: 2, maxHp: 6,  attackDice: ['D10', 'D20'], defense: 1, xp: 45,  special: 'Incorporeal: Only Crown Hits deal damage (Aces ignored)', specialType: 'incorporeal' },
  { name: 'Mimic',           tier: 2, maxHp: 5,  attackDice: ['D8', 'D10'],  defense: 1, xp: 40,  special: 'Surprise: Appears during Search — hero loses action', specialType: 'surprise' },
  { name: 'Dark Priest',     tier: 2, maxHp: 4,  attackDice: ['D10'],        defense: 0, xp: 35,  special: 'Curse: Crown attack destroys one loot item', specialType: 'curse' },
  // Tier 3
  { name: 'Dark Knight',     tier: 3, maxHp: 7,  attackDice: ['D8', 'D10', 'D12'], defense: 2, xp: 70,  special: 'Riposte: If hero deals 0 damage, Dark Knight counterattacks', specialType: 'riposte' },
  { name: 'Dragon Wyrmling', tier: 3, maxHp: 10, attackDice: ['D12', 'D20'], defense: 3, xp: 100, special: 'Breath Weapon: Once per combat, attacks ALL heroes (D20 roll)', specialType: 'breath' },
  { name: 'Lich King',       tier: 3, maxHp: 14, attackDice: ['D10', 'D12', 'D20'], defense: 3, xp: 200, special: 'Phylactery: Reforms with 5 HP once. Summons Skeleton each round if <2 present', specialType: 'phylactery' },
];

export function createMonster(template: typeof MONSTER_TEMPLATES[0]): Monster {
  return {
    ...template,
    id: Math.random().toString(36).slice(2),
    hp: template.maxHp,
    roundsAlive: 0,
    phylacteryUsed: false,
  };
}

export function getMonstersByTier(tier: MonsterTier): typeof MONSTER_TEMPLATES {
  return MONSTER_TEMPLATES.filter(m => m.tier === tier);
}

export function rollMonsterForRoom(tier: MonsterTier): Monster {
  const tierMonsters = getMonstersByTier(tier).filter(m => m.name !== 'Lich King'); // Lich King is boss only
  const idx = Math.floor(Math.random() * tierMonsters.length);
  return createMonster(tierMonsters[idx]);
}

export function generateMonstersForRoom(roomType: RoomType, depth: Depth): Monster[] {
  const tier = depth as MonsterTier;
  const monsters: Monster[] = [];

  if (roomType === 'ambush') {
    const count = depth === 1 ? 3 + Math.floor(Math.random() * 2) : depth === 2 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) monsters.push(rollMonsterForRoom(tier));
  } else if (roomType === 'monster-lair') {
    const count = depth === 1 ? 2 + Math.floor(Math.random() * 2) : depth === 2 ? 1 + Math.floor(Math.random() * 2) : 1;
    for (let i = 0; i < count; i++) monsters.push(rollMonsterForRoom(tier));
  } else if (roomType === 'guarded-room') {
    const count = depth === 1 ? 1 + Math.floor(Math.random() * 2) : 1;
    for (let i = 0; i < count; i++) {
      const m = rollMonsterForRoom(tier);
      if (depth === 3) m.hp = Math.max(1, m.hp - 2); // reduced HP
      monsters.push(m);
    }
  }

  // Depth 3 boss room: Lich King
  if (depth === 3 && roomType === 'monster-lair' && Math.random() < 0.3) {
    monsters.length = 0;
    monsters.push(createMonster(MONSTER_TEMPLATES.find(m => m.name === 'Lich King')!));
  }

  return monsters;
}

// ─── ROOM GENERATION ──────────────────────────────────────────
export interface Room {
  id: string;
  type: RoomType;
  depth: Depth;
  monsters: Monster[];
  cleared: boolean;
  lootDraws: number;
  hasTrap: boolean;
  trapTriggered: boolean;
  hasStairway: boolean;
  isSafeRoom: boolean;
  explorationRoll?: DieRoll[];
}

export function generateRoom(depth: Depth, roomNumber: number): Room {
  const rolls = rollDice(['D4', 'D6', 'D8', 'D10', 'D12', 'D20']);
  const scoringCount = rolls.filter(r => r.result !== 'miss').length;

  let type: RoomType;
  let lootDraws = 0;
  let hasTrap = false;

  if (scoringCount === 0) type = 'ambush';
  else if (scoringCount === 1) { type = 'monster-lair'; lootDraws = 1; }
  else if (scoringCount === 2) { type = 'guarded-room'; lootDraws = 1; }
  else if (scoringCount === 3) { type = 'trapped-passage'; hasTrap = true; lootDraws = 1; }
  else if (scoringCount === 4) { type = 'treasure-room'; lootDraws = 2; }
  else if (scoringCount === 5) { type = 'shrine'; lootDraws = 1; }
  else { type = 'prismatic-vault'; lootDraws = 3; }

  const hasStairway = roomNumber > 0 && roomNumber % 4 === 0;
  const isSafeRoom = roomNumber > 0 && roomNumber % 5 === 0 && scoringCount >= 3;

  const monsters = (type === 'ambush' || type === 'monster-lair' || type === 'guarded-room')
    ? generateMonstersForRoom(type, depth)
    : [];

  return {
    id: Math.random().toString(36).slice(2),
    type,
    depth,
    monsters,
    cleared: monsters.length === 0,
    lootDraws,
    hasTrap,
    trapTriggered: false,
    hasStairway,
    isSafeRoom,
    explorationRoll: rolls,
  };
}

// ─── LOOT SYSTEM ──────────────────────────────────────────────
export interface LootItem {
  id: string;
  name: string;
  suit: LootSuit;
  cardValue: string;
  effect: string;
  type: 'consumable' | 'permanent' | 'conditional';
  used: boolean;
}

export function drawLootCard(): LootItem {
  const suits: LootSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const cardNum = Math.floor(Math.random() * 13) + 1; // 1-13 (A=1, J=11, Q=12, K=13)

  const cardLabel = cardNum === 1 ? 'A' : cardNum === 11 ? 'J' : cardNum === 12 ? 'Q' : cardNum === 13 ? 'K' : String(cardNum);

  let name = '';
  let effect = '';
  let type: LootItem['type'] = 'consumable';

  if (suit === 'hearts') {
    if (cardNum <= 5) { name = 'Minor Healing Potion'; effect = 'Restore 2 HP (use anytime)'; type = 'consumable'; }
    else if (cardNum <= 10) { name = 'Major Healing Potion'; effect = 'Restore 5 HP'; type = 'consumable'; }
    else if (cardNum === 11) { name = 'Potion of Fortitude'; effect = '+2 max HP permanently'; type = 'permanent'; }
    else if (cardNum === 12) { name = 'Elixir of Resilience'; effect = 'Ignore next Prism consequence'; type = 'consumable'; }
    else { name = 'Phoenix Tears'; effect = 'Auto-revive from 0 HP with 4 HP'; type = 'consumable'; }
  } else if (suit === 'diamonds') {
    if (cardNum <= 5) { name = 'Gold Pouch'; effect = '+10 XP (banked immediately)'; type = 'consumable'; }
    else if (cardNum <= 10) { name = 'Gemstone Cache'; effect = '+25 XP (banked immediately)'; type = 'consumable'; }
    else if (cardNum === 11) { name = 'Golden Idol'; effect = '+50 XP (banked immediately)'; type = 'consumable'; }
    else if (cardNum === 12) { name = 'Banking Token'; effect = 'Bank all unbanked XP without retreating'; type = 'consumable'; }
    else { name = 'Crown of Greed'; effect = '+100 XP if you retreat without any hero downed'; type = 'conditional'; }
  } else if (suit === 'clubs') {
    if (cardNum <= 3) { name = 'Sharpened Blade'; effect = '+1 Hit to next weapon attack'; type = 'consumable'; }
    else if (cardNum <= 6) { name = 'Throwing Knives'; effect = 'Ranged attack D4+D6 (range 3, unlimited)'; type = 'permanent'; }
    else if (cardNum <= 9) { name = 'Enchanted Weapon'; effect = 'Upgrade one Weapon Die by one size'; type = 'permanent'; }
    else if (cardNum === 10) { name = 'Vorpal Edge'; effect = 'Crowns deal +2 extra Hits for the Delve'; type = 'permanent'; }
    else if (cardNum === 11) { name = 'Cursed Blade'; effect = 'Add D20 to weapon pool; Prism on attack = 1 self-damage'; type = 'permanent'; }
    else if (cardNum === 12) { name = 'Runic Greataxe'; effect = 'Replace weapon pool with D10+D12'; type = 'permanent'; }
    else { name = 'Prismatic Blade'; effect = 'Once per room, reroll one missed weapon die'; type = 'consumable'; }
  } else { // spades
    if (cardNum <= 3) { name = 'Shield Fragment'; effect = '+1 Block on next defense roll'; type = 'consumable'; }
    else if (cardNum <= 6) { name = 'Chainmail Patch'; effect = 'Permanently add D6 to armor pool'; type = 'permanent'; }
    else if (cardNum <= 9) { name = 'Enchanted Shield'; effect = 'Upgrade one Armor Die by one size'; type = 'permanent'; }
    else if (cardNum === 10) { name = 'Aegis Charm'; effect = 'Once per room, force monster to reroll one attack die'; type = 'consumable'; }
    else if (cardNum === 11) { name = 'Shadow Cloak'; effect = 'Use Reserve Dice for defense for the Delve'; type = 'permanent'; }
    else if (cardNum === 12) { name = 'Adamantine Plate'; effect = 'Replace armor pool with D8+D10+D12'; type = 'permanent'; }
    else { name = 'Mirror Shield'; effect = 'Once per Delve, reflect all damage from one attack'; type = 'consumable'; }
  }

  return { id: Math.random().toString(36).slice(2), name, suit, cardValue: cardLabel, effect, type, used: false };
}

// ─── XP AND LEVELING ──────────────────────────────────────────
export const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600];

export function getLevel(bankedXp: number): number {
  if (bankedXp >= 600) return 4;
  if (bankedXp >= 300) return 3;
  if (bankedXp >= 100) return 2;
  return 1;
}

export function xpToNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level + 1, 4)] || 600;
}

// ─── GAME STATE ───────────────────────────────────────────────
export interface GameState {
  phase: GamePhase;
  heroes: HeroStats[];
  activeHeroIndex: number;
  currentRoom: Room | null;
  roomHistory: Room[];
  roomNumber: number;
  depth: Depth;
  combatPhase: CombatPhase;
  activeMonsterIndex: number;
  log: LogEntry[];
  pendingLootDraws: number;
  isAmbushRoom: boolean;
  isSurpriseRound: boolean; // monsters go first
  delveScore: number;
  gameOverReason?: string;
  victoryReason?: string;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'action' | 'damage' | 'heal' | 'prism' | 'loot' | 'system' | 'combo' | 'death' | 'crown';
  timestamp: number;
}

export function createLog(text: string, type: LogEntry['type']): LogEntry {
  return { id: Math.random().toString(36).slice(2), text, type, timestamp: Date.now() };
}

export function initGameState(heroClasses: HeroClass[]): GameState {
  const heroes = heroClasses.map(createHero);
  return {
    phase: heroClasses.length === 0 ? 'hero-select' : 'dungeon',
    heroes,
    activeHeroIndex: 0,
    currentRoom: null,
    roomHistory: [],
    roomNumber: 0,
    depth: 1,
    combatPhase: 'player-turn',
    activeMonsterIndex: 0,
    log: [createLog('⚡ The dungeon awakens. Descend into the Prismatic Depths...', 'system')],
    pendingLootDraws: 0,
    isAmbushRoom: false,
    isSurpriseRound: false,
    delveScore: 0,
  };
}

// ─── COMBAT HELPERS ───────────────────────────────────────────
export function calculateDamage(hits: number, blocks: number, ignoreDefense: boolean = false): number {
  if (ignoreDefense) return Math.max(0, hits);
  return Math.max(0, hits - blocks);
}

export function monsterAttack(monster: Monster, hero: HeroStats): { rolls: DieRoll[]; hits: number; blocks: number; damage: number; log: string } {
  const attackRolls = rollDice(monster.attackDice);
  let hits = attackRolls.reduce((sum, r) => sum + r.hits, 0);

  // Apply combo bonuses for monster (simplified — monsters don't press)
  const combo = checkComboBonuses(attackRolls);
  hits += combo.bonusHits;

  // Hero defense
  let defenseDice = [...hero.armorDice];
  if (hero.shadowCloak) defenseDice = [...defenseDice, ...hero.reserveDice];
  const defenseRolls = rollDice(defenseDice);
  let blocks = defenseRolls.reduce((sum, r) => {
    if (r.result === 'crown') return sum + 2;
    if (r.result === 'ace') return sum + 1;
    return sum;
  }, 0);

  const damage = calculateDamage(hits, blocks);
  return {
    rolls: attackRolls,
    hits,
    blocks,
    damage,
    log: `${monster.name} attacks for ${hits} hits, ${blocks} blocked → ${damage} damage`,
  };
}

// ─── TRAP CHECK ───────────────────────────────────────────────
export function trapCheck(): { rolls: DieRoll[]; passed: boolean } {
  const rolls = rollDice(['D8', 'D10']);
  const passed = rolls.some(r => r.result !== 'miss');
  return { rolls, passed };
}

// ─── EXPLORATION ROLL ─────────────────────────────────────────
export function explorationRoll(): { rolls: DieRoll[]; scoringCount: number; roomType: RoomType } {
  const rolls = rollDice(['D4', 'D6', 'D8', 'D10', 'D12', 'D20']);
  const scoringCount = rolls.filter(r => r.result !== 'miss').length;

  let roomType: RoomType;
  if (scoringCount === 0) roomType = 'ambush';
  else if (scoringCount === 1) roomType = 'monster-lair';
  else if (scoringCount === 2) roomType = 'guarded-room';
  else if (scoringCount === 3) roomType = 'trapped-passage';
  else if (scoringCount === 4) roomType = 'treasure-room';
  else if (scoringCount === 5) roomType = 'shrine';
  else roomType = 'prismatic-vault';

  return { rolls, scoringCount, roomType };
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  entrance: 'Safe Room — Entrance',
  ambush: '⚠ AMBUSH!',
  'monster-lair': 'Monster Lair',
  'guarded-room': 'Guarded Room',
  'trapped-passage': 'Trapped Passage',
  'treasure-room': '✦ Treasure Room',
  shrine: '✦ Shrine',
  'prismatic-vault': '✦✦ PRISMATIC VAULT',
  stairway: 'Stairway',
  'safe-room': 'Safe Room',
};

export const ROOM_TYPE_COLORS: Record<RoomType, string> = {
  entrance: 'text-green-400',
  ambush: 'text-red-400',
  'monster-lair': 'text-orange-400',
  'guarded-room': 'text-yellow-400',
  'trapped-passage': 'text-amber-400',
  'treasure-room': 'text-cyan-400',
  shrine: 'text-green-400',
  'prismatic-vault': 'text-purple-400',
  stairway: 'text-blue-400',
  'safe-room': 'text-green-400',
};
