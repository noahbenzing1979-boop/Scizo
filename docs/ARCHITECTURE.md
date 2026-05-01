# Architecture

PRISMATIC DEPTHS is organized around a small, explicit split:

- `client/` owns the neon dungeon terminal and player-facing flow.
- `server/` owns future run state, combat resolution, and procedural room generation.
- `shared/` owns game constants that both sides need to agree on.

## Core Loop

1. Choose a hero class or party.
2. Enter a room in the current depth.
3. Roll the class dice pool.
4. Keep the result or press for a reroll.
5. Resolve damage, defense, combo bonuses, loot, and XP.
6. Bank or risk progress before the next room.

## PRISM Dice

PRISM dice are color-coded signal faces. Each face should eventually carry both a mechanical result and a visual identity so rolls feel like terminal output, playing cards, and dungeon magic at once.

## Scaffold Status

This repo is intentionally a foundation. The current code establishes data shape, project boundaries, README identity, and a minimal Vite landing page. The playable engine comes next.
