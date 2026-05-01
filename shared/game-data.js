export const PRISM_DICE = [
  { id: "pulse", label: "Pulse", color: "Crimson", effect: "Adds direct strike pressure." },
  { id: "rift", label: "Rift", color: "Violet", effect: "Splits damage across targets." },
  { id: "ion", label: "Ion", color: "Cyan", effect: "Charges combo windows." },
  { id: "sol", label: "Sol", color: "Gold", effect: "Stabilizes defense and recovery." },
  { id: "myth", label: "Myth", color: "Emerald", effect: "Triggers class signatures." },
  { id: "void", label: "Void", color: "Black", effect: "Misses cleanly or detonates risk." }
];

export const HERO_CLASSES = [
  { id: "ironclad", name: "Ironclad", hp: 14, dicePool: ["pulse", "pulse", "sol"], role: "Frontline armor breaker" },
  { id: "shade", name: "Shade", hp: 9, dicePool: ["rift", "ion", "void"], role: "Press-heavy burst striker" },
  { id: "arcanist", name: "Arcanist", hp: 8, dicePool: ["ion", "myth", "rift"], role: "Combo engine and room control" },
  { id: "warden", name: "Warden", hp: 12, dicePool: ["sol", "myth", "pulse"], role: "Party stabilizer and guard" }
];

export const MONSTER_TIERS = [
  { tier: 1, label: "Common", count: 6, pressure: "Early-depth fodder" },
  { tier: 2, label: "Elite", count: 5, pressure: "Special abilities punish reckless play" },
  { tier: 3, label: "Boss", count: 2, pressure: "Depth guardians with unique mechanics" }
];

export const ROOM_TYPES = [
  "Gate",
  "Reliquary",
  "Ambush",
  "Shrine",
  "Market",
  "Rift",
  "Vault",
  "Depth Guardian"
];

export const LOOT_CATEGORIES = [
  { id: "weapons", label: "Weapons", purpose: "Modify your dice pool." },
  { id: "armor", label: "Armor", purpose: "Absorb hits before HP loss." },
  { id: "artifacts", label: "Artifacts", purpose: "Grant passive abilities and combo modifiers." },
  { id: "consumables", label: "Consumables", purpose: "Create one-shot power spikes." }
];

export const DEPTHS = [
  { id: "depth-1", label: "Depth I", xpMultiplier: 1 },
  { id: "depth-2", label: "Depth II", xpMultiplier: 1.5 },
  { id: "depth-3", label: "Depth III", xpMultiplier: 2.25 }
];

export const PARTY_MODES = [
  { id: "solo", label: "Solo", heroes: 1 },
  { id: "party", label: "Party", heroes: 4 }
];
