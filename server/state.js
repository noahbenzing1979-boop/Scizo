import { DEPTHS, HERO_CLASSES, PARTY_MODES } from "../shared/game-data.js";

export function createInitialGameState() {
  return {
    title: "PRISMATIC DEPTHS",
    engine: "Scizo",
    depth: DEPTHS[0].id,
    partyMode: PARTY_MODES[0].id,
    heroes: HERO_CLASSES.map((hero) => ({
      id: hero.id,
      level: 1,
      xpBanked: 0,
      hp: hero.hp,
      dicePool: hero.dicePool
    })),
    run: {
      roomIndex: 0,
      threat: 1,
      banked: false
    }
  };
}
