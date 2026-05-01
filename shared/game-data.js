export const PRISM_DICE = [
  { id: "pulse", label: "Pulse", color: "Crimson", icon: "P", damage: 3, guard: 0, focus: 0, effect: "Adds direct strike pressure." },
  { id: "rift", label: "Rift", color: "Violet", icon: "R", damage: 2, guard: 0, focus: 1, effect: "Splits damage across targets." },
  { id: "ion", label: "Ion", color: "Cyan", icon: "I", damage: 1, guard: 0, focus: 2, effect: "Charges combo windows." },
  { id: "sol", label: "Sol", color: "Gold", icon: "S", damage: 1, guard: 3, focus: 0, effect: "Stabilizes defense and recovery." },
  { id: "myth", label: "Myth", color: "Emerald", icon: "M", damage: 2, guard: 1, focus: 1, effect: "Triggers class signatures." },
  { id: "void", label: "Void", color: "Black", icon: "V", damage: 0, guard: 0, focus: 0, effect: "Misses cleanly or detonates risk." }
];

export const HERO_CLASSES = [
  {
    id: "ironclad",
    name: "Ironclad",
    hp: 18,
    dicePool: ["pulse", "pulse", "sol", "myth"],
    role: "Frontline armor breaker",
    gift: "First block each room gains +2 guard."
  },
  {
    id: "shade",
    name: "Shade",
    hp: 13,
    dicePool: ["rift", "rift", "ion", "void"],
    role: "Press-heavy burst striker",
    gift: "First press each room adds +2 damage if it succeeds."
  },
  {
    id: "arcanist",
    name: "Arcanist",
    hp: 12,
    dicePool: ["ion", "ion", "myth", "rift"],
    role: "Combo engine and room control",
    gift: "Three focus converts into +3 damage."
  },
  {
    id: "warden",
    name: "Warden",
    hp: 16,
    dicePool: ["sol", "sol", "myth", "pulse"],
    role: "Party stabilizer and guard",
    gift: "Sol results also heal 1 HP."
  }
];

export const MONSTERS = [
  { name: "Glass Imp", tier: 1, hp: 8, attack: 3, reward: 4, quirk: "Cracks under clean combos." },
  { name: "Static Maw", tier: 1, hp: 10, attack: 4, reward: 5, quirk: "Punishes missed presses." },
  { name: "Lantern Husk", tier: 1, hp: 11, attack: 3, reward: 5, quirk: "Flickers when guarded." },
  { name: "Mirror Knight", tier: 2, hp: 15, attack: 5, reward: 8, quirk: "Reflects weak rolls." },
  { name: "Rift Choir", tier: 2, hp: 17, attack: 6, reward: 10, quirk: "Grows louder after presses." },
  { name: "Debt Collector", tier: 2, hp: 18, attack: 6, reward: 10, quirk: "Taxes unbanked XP." },
  { name: "Prism Warden", tier: 3, hp: 24, attack: 7, reward: 16, quirk: "A guardian of the third depth." }
];

export const ROOM_TYPES = [
  { id: "gate", name: "Gate", mood: "A clean threshold humming with low voltage." },
  { id: "reliquary", name: "Reliquary", mood: "Loot glows behind a patient lock." },
  { id: "ambush", name: "Ambush", mood: "The floor answers before you step." },
  { id: "shrine", name: "Shrine", mood: "A quiet machine offers mercy for courage." },
  { id: "market", name: "Market", mood: "A smiling vendor counts your unbanked XP." },
  { id: "rift", name: "Rift", mood: "The walls split into too many possible exits." },
  { id: "vault", name: "Vault", mood: "Treasure breathes behind the next fight." },
  { id: "guardian", name: "Depth Guardian", mood: "The room is waiting for your name." }
];

export const LOOT = [
  { name: "Neon Edge", type: "Weapon", text: "+1 damage on Pulse and Rift.", damage: 1, trigger: ["pulse", "rift"] },
  { name: "Warm Aegis", type: "Armor", text: "+1 guard on Sol and Myth.", guard: 1, trigger: ["sol", "myth"] },
  { name: "Lucky Capacitor", type: "Artifact", text: "+1 focus on Ion.", focus: 1, trigger: ["ion"] },
  { name: "Blackout Charm", type: "Artifact", text: "Void deals 1 damage instead of 0.", voidDamage: 1 },
  { name: "Ruby Ration", type: "Consumable", text: "Heal 4 immediately.", heal: 4 },
  { name: "Press Token", type: "Consumable", text: "Next press has no incoming counterattack.", safePress: 1 }
];

export const DEPTHS = [
  { id: "depth-1", label: "Depth I", xpMultiplier: 1, threat: 1 },
  { id: "depth-2", label: "Depth II", xpMultiplier: 1.5, threat: 2 },
  { id: "depth-3", label: "Depth III", xpMultiplier: 2.25, threat: 3 }
];

export const PARTY_MODES = [
  { id: "solo", label: "Solo", heroes: 1 },
  { id: "party", label: "Party", heroes: 4 }
];
