// ============================================================
// PRISMATIC DEPTHS — Game State Context
// Design: Neon Dungeon Terminal
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  GameState, HeroClass, HeroStats, Monster, DieType, DieRoll, LootItem,
  GamePhase, Room, RoomType, Depth,
  createLog, initGameState, createHero, createMonster,
  rollDice, checkComboBonuses, calculateDamage, monsterAttack,
  generateRoom, drawLootCard, getLevel, trapCheck, explorationRoll,
  MONSTER_TEMPLATES, HERO_TEMPLATES, DIE_CONFIG, scoreDie,
} from '@/lib/gameEngine';
// Note: initGameState is used for initial state and RESET_GAME action

// ─── ACTION TYPES ─────────────────────────────────────────────
type GameAction =
  | { type: 'START_GAME'; heroClasses: HeroClass[] }
  | { type: 'EXPLORE_ROOM' }
  | { type: 'ATTACK'; heroIndex: number; monsterIndex: number; reserveDie?: DieType; spellDice?: DieType[] }
  | { type: 'DEFEND_HERO'; heroIndex: number }
  | { type: 'MONSTER_ATTACK_PHASE' }
  | { type: 'USE_ITEM'; heroIndex: number; itemId: string }
  | { type: 'DRAW_LOOT'; heroIndex: number }
  | { type: 'BANK_XP' }
  | { type: 'RETREAT' }
  | { type: 'DESCEND' }
  | { type: 'NEXT_HERO_TURN' }
  | { type: 'HEAL_ALLY'; healerIndex: number; targetIndex: number }
  | { type: 'REVIVE_ALLY'; reviverIndex: number; targetIndex: number }
  | { type: 'USE_SPECIAL'; heroIndex: number; targetIndex?: number }
  | { type: 'SEARCH_ROOM'; heroIndex: number }
  | { type: 'ADD_LOG'; text: string; logType: GameState['log'][0]['type'] }
  | { type: 'RESET_GAME' };

// ─── REDUCER ──────────────────────────────────────────────────
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'START_GAME': {
      const newState = initGameState(action.heroClasses);
      // Solo play adjustments (1-2 heroes)
      if (action.heroClasses.length <= 2) {
        newState.heroes.forEach(h => {
          // Start with 1 free loot draw
        });
        newState.pendingLootDraws = 1;
        newState.log.push(createLog('Solo mode: Start with 1 free loot draw. All monster HP reduced by 1.', 'system'));
      }
      // Generate entrance room
      const entranceRoom: Room = {
        id: 'entrance',
        type: 'entrance',
        depth: 1,
        monsters: [],
        cleared: true,
        lootDraws: 0,
        hasTrap: false,
        trapTriggered: false,
        hasStairway: false,
        isSafeRoom: true,
      };
      return { ...newState, currentRoom: entranceRoom, phase: 'dungeon' };
    }

    case 'EXPLORE_ROOM': {
      const { rolls, scoringCount, roomType } = explorationRoll();
      const roomNum = state.roomNumber + 1;
      const room = generateRoom(state.depth, roomNum);
      room.explorationRoll = rolls;

      // Solo mode: reduce monster HP by 1
      if (state.heroes.length <= 2) {
        room.monsters.forEach(m => { m.hp = Math.max(1, m.hp - 1); m.maxHp = Math.max(1, m.maxHp - 1); });
      }

      const isAmbush = roomType === 'ambush';
      const logs = [...state.log];
      logs.push(createLog(`🎲 Exploration roll: ${scoringCount} scoring dice → ${room.type.replace(/-/g, ' ').toUpperCase()}`, 'system'));

      if (room.type === 'shrine') {
        // Heal all heroes 3 HP
        const healedHeroes = state.heroes.map(h => ({
          ...h,
          hp: Math.min(h.maxHp, h.hp + 3),
          blessingTokens: h.blessingTokens + (state.activeHeroIndex === state.heroes.indexOf(h) ? 1 : 0),
        }));
        logs.push(createLog('✦ SHRINE! All heroes heal 3 HP. Explorer gains a Blessing Token.', 'heal'));
        return {
          ...state,
          heroes: healedHeroes,
          currentRoom: room,
          roomNumber: roomNum,
          phase: 'dungeon',
          combatPhase: 'player-turn',
          log: logs,
          isAmbushRoom: false,
          isSurpriseRound: false,
        };
      }

      if (room.type === 'prismatic-vault') {
        const xpHeroes = state.heroes.map(h => ({ ...h, xp: h.xp + 50, bankedXp: h.bankedXp + 50 }));
        logs.push(createLog('✦✦ PRISMATIC VAULT! All heroes gain 50 bonus XP (banked). Draw 3 loot cards!', 'crown'));
        return {
          ...state,
          heroes: xpHeroes,
          currentRoom: room,
          roomNumber: roomNum,
          phase: room.lootDraws > 0 ? 'loot' : 'dungeon',
          pendingLootDraws: room.lootDraws,
          log: logs,
          isAmbushRoom: false,
          isSurpriseRound: false,
        };
      }

      if (room.type === 'treasure-room') {
        logs.push(createLog('✦ TREASURE ROOM! No monsters. Draw 2 loot cards!', 'loot'));
        return {
          ...state,
          currentRoom: room,
          roomNumber: roomNum,
          phase: 'loot',
          pendingLootDraws: room.lootDraws,
          log: logs,
          isAmbushRoom: false,
          isSurpriseRound: false,
        };
      }

      const newPhase: GamePhase = room.monsters.length > 0 ? 'combat' : 'dungeon';
      const surpriseRound = isAmbush;

      if (isAmbush) logs.push(createLog('⚠ AMBUSH! Monsters get a surprise round — they attack first!', 'damage'));
      else if (room.monsters.length > 0) logs.push(createLog(`⚔ ${room.monsters.map(m => m.name).join(', ')} appear!`, 'action'));

      return {
        ...state,
        currentRoom: room,
        roomNumber: roomNum,
        phase: newPhase,
        combatPhase: surpriseRound ? 'monster-turn' : 'player-turn',
        activeMonsterIndex: 0,
        log: logs,
        isAmbushRoom: isAmbush,
        isSurpriseRound: surpriseRound,
      };
    }

    case 'ATTACK': {
      if (!state.currentRoom) return state;
      const hero = state.heroes[action.heroIndex];
      const monster = state.currentRoom.monsters[action.monsterIndex];
      if (!monster || monster.hp <= 0 || hero.isDown) return state;

      const logs = [...state.log];
      let updatedHero = { ...hero };
      let updatedMonster = { ...monster };
      const updatedHeroes = [...state.heroes];

      // Determine attack dice
      let attackDice: DieType[] = [...hero.weaponDice];
      const isSpellcast = hero.class === 'Arcanist' && action.spellDice && action.spellDice.length > 0;

      if (isSpellcast && action.spellDice) {
        attackDice = action.spellDice;
      }

      // Ambush bonus for Shade
      const isAmbushAttack = hero.class === 'Shade' && state.isSurpriseRound;

      // Roll attack
      let rolls = rollDice(attackDice);

      // Ambush: all dice treated as Aces (re-roll non-1s once for free)
      if (isAmbushAttack) {
        rolls = rolls.map(r => {
          if (r.result === 'miss') {
            const reroll = { type: r.type, value: Math.floor(Math.random() * DIE_CONFIG[r.type].sides) + 1, result: r.result, hits: r.hits, setAside: false };
            const scored = scoreDie(r.type, reroll.value);
            return { ...reroll, result: scored.result, hits: scored.hits };
          }
          return r;
        });
        logs.push(createLog('🗡 AMBUSH! Shade\'s first attack — all Aces score, Crowns deal +1 bonus Hit.', 'action'));
      }

      let totalHits = rolls.reduce((sum, r) => sum + r.hits, 0);

      // Blessing token bonus
      if (updatedHero.blessingTokens > 0) {
        totalHits += 1;
        updatedHero = { ...updatedHero, blessingTokens: updatedHero.blessingTokens - 1 };
        logs.push(createLog('✦ Blessing Token used: +1 Hit', 'heal'));
      }

      // Sharpened Blade
      const sharpenedIdx = updatedHero.inventory.findIndex(i => i.name === 'Sharpened Blade' && !i.used);
      if (sharpenedIdx >= 0) {
        totalHits += 1;
        const newInv = [...updatedHero.inventory];
        newInv[sharpenedIdx] = { ...newInv[sharpenedIdx], used: true };
        updatedHero = { ...updatedHero, inventory: newInv };
        logs.push(createLog('⚔ Sharpened Blade: +1 Hit', 'action'));
      }

      // Combo bonuses
      const combo = checkComboBonuses(rolls);
      if (combo.tripleStrike) { totalHits += 3; logs.push(createLog('✦ TRIPLE STRIKE! +3 bonus Hits', 'combo')); }
      if (combo.precisionStrike) logs.push(createLog('✦ PRECISION STRIKE! All Hits ignore defense', 'combo'));
      if (combo.fullSpectrum) { totalHits *= 2; logs.push(createLog('✦✦ FULL SPECTRUM! Double Hits + Extra Action!', 'combo')); }

      // Arcanist spellcast: Crown Hits deal TRIPLE value
      if (isSpellcast) {
        const crownHits = rolls.filter(r => r.result === 'crown').reduce((sum, r) => sum + r.hits * 2, 0); // extra 2x on top
        totalHits += crownHits;
        logs.push(createLog(`🔮 Spellcast! Crown Hits deal triple value.`, 'action'));
      }

      // Vorpal Edge: Crowns deal +2 extra Hits
      if (updatedHero.vorpalEdge) {
        const crownCount = rolls.filter(r => r.result === 'crown').length;
        totalHits += crownCount * 2;
        if (crownCount > 0) logs.push(createLog(`⚔ Vorpal Edge: +${crownCount * 2} Hits from Crowns`, 'action'));
      }

      // Ambush Crown bonus
      if (isAmbushAttack) {
        const crownCount = rolls.filter(r => r.result === 'crown').length;
        totalHits += crownCount;
      }

      // Press with reserve die (optional)
      let pressResult: 'none' | 'success' | 'prism' = 'none';
      if (action.reserveDie) {
        const pressRoll = rollDice([action.reserveDie]);
        const pressHits = pressRoll[0].hits;
        if (pressHits > 0) {
          totalHits += pressHits;
          pressResult = 'success';
          logs.push(createLog(`🎲 Press with ${action.reserveDie}: ${pressRoll[0].value} → +${pressHits} Hits!`, 'action'));
        } else {
          // PRISM!
          pressResult = 'prism';
          // Check Elixir of Resilience
          const elixirIdx = updatedHero.inventory.findIndex(i => i.name === 'Elixir of Resilience' && !i.used);
          if (elixirIdx >= 0) {
            const newInv = [...updatedHero.inventory];
            newInv[elixirIdx] = { ...newInv[elixirIdx], used: true };
            updatedHero = { ...updatedHero, inventory: newInv };
            logs.push(createLog('💎 Elixir of Resilience absorbs the PRISM! Attack continues.', 'heal'));
            pressResult = 'none'; // Elixir saved it
          } else {
            totalHits = 0;
            logs.push(createLog(`⚡ PRISM! All Hits lost. ${monster.name} counterattacks!`, 'prism'));
            // Cursed Blade self-damage
            if (updatedHero.cursedBlade) {
              updatedHero = { ...updatedHero, hp: updatedHero.hp - 1 };
              logs.push(createLog('💀 Cursed Blade: 1 self-damage from PRISM!', 'damage'));
            }
            // Monster counterattack (no defense)
            const counterRolls = rollDice(monster.attackDice);
            const counterHits = counterRolls.reduce((sum, r) => sum + r.hits, 0);
            updatedHero = { ...updatedHero, hp: updatedHero.hp - counterHits };
            logs.push(createLog(`⚔ ${monster.name} counterattacks for ${counterHits} damage (undefended)!`, 'damage'));
          }
        }
      }

      // Spellcast backfire check (if no reserve press was used)
      if (isSpellcast && pressResult === 'none') {
        const allMiss = rolls.every(r => r.result === 'miss');
        if (allMiss) {
          const backfireDmg = (action.spellDice?.length || 0);
          updatedHero = { ...updatedHero, hp: updatedHero.hp - backfireDmg };
          logs.push(createLog(`💥 SPELL BACKFIRE! Arcanist takes ${backfireDmg} damage!`, 'prism'));
          totalHits = 0;
        }
      }

      // Calculate defense
      let defenseRolls = rollDice(monster.attackDice.length > 0 ? [] : []);
      let blocks = monster.defense; // flat defense value
      let ignoreDefense = combo.precisionStrike;

      // Brittle skeleton: Crown Hits deal +1
      if (monster.specialType === 'brittle') {
        const crownHits = rolls.filter(r => r.result === 'crown').length;
        totalHits += crownHits;
        if (crownHits > 0) logs.push(createLog(`💀 Brittle! Crown Hits deal +1 extra damage to Skeleton.`, 'action'));
      }

      // Incorporeal Wraith: Ace Hits deal no damage
      if (monster.specialType === 'incorporeal') {
        const aceHits = rolls.filter(r => r.result === 'ace').reduce((sum, r) => sum + r.hits, 0);
        totalHits -= aceHits;
        if (aceHits > 0) logs.push(createLog(`👻 Incorporeal! Ace Hits deal no damage to Wraith.`, 'action'));
      }

      const damage = ignoreDefense ? Math.max(0, totalHits) : Math.max(0, totalHits - blocks);
      updatedMonster = { ...updatedMonster, hp: updatedMonster.hp - damage };

      logs.push(createLog(`⚔ ${hero.class} attacks ${monster.name}: ${totalHits} hits, ${blocks} blocked → ${damage} damage`, 'action'));

      // Check Riposte (Dark Knight)
      if (monster.specialType === 'riposte' && damage === 0 && totalHits > 0) {
        const riposteRolls = rollDice(monster.attackDice);
        const riposteHits = riposteRolls.reduce((sum, r) => sum + r.hits, 0);
        updatedHero = { ...updatedHero, hp: updatedHero.hp - riposteHits };
        logs.push(createLog(`⚔ RIPOSTE! Dark Knight counterattacks for ${riposteHits} damage!`, 'damage'));
      }

      // Monster death
      let xpGained = 0;
      let updatedMonsters = [...state.currentRoom.monsters];
      updatedMonsters[action.monsterIndex] = updatedMonster;

      if (updatedMonster.hp <= 0) {
        // Phylactery check
        if (monster.specialType === 'phylactery' && !monster.phylacteryUsed) {
          updatedMonsters[action.monsterIndex] = { ...updatedMonster, hp: 5, phylacteryUsed: true };
          logs.push(createLog(`💀 PHYLACTERY! The Lich King reforms with 5 HP!`, 'system'));
        } else {
          xpGained = monster.xp * state.depth;
          updatedHero = { ...updatedHero, xp: updatedHero.xp + xpGained };
          logs.push(createLog(`💀 ${monster.name} defeated! +${xpGained} XP`, 'crown'));

          // Goblin flee check
          if (monster.specialType === 'cowardly') {
            // Already dead, no flee needed
          }
        }
      }

      // Check if all monsters cleared
      const allCleared = updatedMonsters.every(m => m.hp <= 0);
      const updatedRoom = { ...state.currentRoom, monsters: updatedMonsters, cleared: allCleared };

      // Check hero death
      if (updatedHero.hp <= 0) {
        // Phoenix Tears auto-revive
        const phoenixIdx = updatedHero.inventory.findIndex(i => i.name === 'Phoenix Tears' && !i.used);
        if (phoenixIdx >= 0) {
          const newInv = [...updatedHero.inventory];
          newInv[phoenixIdx] = { ...newInv[phoenixIdx], used: true };
          updatedHero = { ...updatedHero, hp: 4, inventory: newInv, isDown: false };
          logs.push(createLog(`🔥 Phoenix Tears! ${hero.class} auto-revives with 4 HP!`, 'heal'));
        } else {
          updatedHero = { ...updatedHero, hp: 0, isDown: true };
          logs.push(createLog(`💀 ${hero.class} is DOWNED!`, 'death'));
        }
      }

      updatedHeroes[action.heroIndex] = updatedHero;

      // Check TPK
      const allDown = updatedHeroes.every(h => h.isDown);
      if (allDown) {
        const totalLost = updatedHeroes.reduce((sum, h) => sum + h.xp, 0);
        return {
          ...state,
          heroes: updatedHeroes,
          currentRoom: updatedRoom,
          log: [...logs, createLog(`💀 TOTAL PARTY KILL! All unbanked XP (${totalLost}) is lost forever.`, 'death')],
          phase: 'game-over',
          gameOverReason: 'Total Party Kill — all heroes were downed.',
        };
      }

      // Loot after clearing
      let newPhase: GamePhase = state.phase;
      let pendingLoot = state.pendingLootDraws;
      if (allCleared && updatedRoom.lootDraws > 0) {
        pendingLoot = updatedRoom.lootDraws;
        newPhase = 'loot';
        logs.push(createLog(`✦ Room cleared! Draw ${updatedRoom.lootDraws} loot card(s).`, 'loot'));
      } else if (allCleared) {
        newPhase = 'dungeon';
        logs.push(createLog(`✦ Room cleared! Press on or retreat.`, 'system'));
      }

      return {
        ...state,
        heroes: updatedHeroes,
        currentRoom: updatedRoom,
        log: logs,
        phase: newPhase,
        pendingLootDraws: pendingLoot,
        isSurpriseRound: false,
      };
    }

    case 'MONSTER_ATTACK_PHASE': {
      if (!state.currentRoom) return state;
      const logs = [...state.log];
      let updatedHeroes = [...state.heroes];
      let updatedMonsters = [...state.currentRoom.monsters];

      // Regenerate Cave Troll
      updatedMonsters = updatedMonsters.map(m => {
        if (m.specialType === 'regenerate' && m.hp > 0 && m.hp < m.maxHp) {
          logs.push(createLog(`🔄 ${m.name} regenerates 1 HP!`, 'heal'));
          return { ...m, hp: Math.min(m.maxHp, m.hp + 1), roundsAlive: m.roundsAlive + 1 };
        }
        return { ...m, roundsAlive: m.roundsAlive + 1 };
      });

      // Cultist ritual summon
      updatedMonsters.forEach(m => {
        if (m.specialType === 'ritual' && m.hp > 0 && m.roundsAlive >= 2) {
          const newMonster = { name: 'Giant Rat', tier: 1 as const, maxHp: 1, attackDice: ['D4'] as DieType[], defense: 0, xp: 5, special: 'Swarm', specialType: 'swarm' as const };
          updatedMonsters.push(createMonster(newMonster));
          logs.push(createLog(`🔮 Dark Ritual! Cultist summons a Giant Rat!`, 'system'));
        }
      });

      // Lich King summon
      const lichKing = updatedMonsters.find(m => m.specialType === 'phylactery' && m.hp > 0);
      if (lichKing) {
        const skeletonCount = updatedMonsters.filter(m => m.name === 'Skeleton Warrior' && m.hp > 0).length;
        if (skeletonCount < 2) {
          const skelTemplate = MONSTER_TEMPLATES.find(m => m.name === 'Skeleton Warrior')!;
          updatedMonsters.push(createMonster(skelTemplate));
          logs.push(createLog(`💀 Lich King summons a Skeleton Warrior!`, 'system'));
        }
      }

      // Dragon Breath (once per combat, random chance)
      const dragon = updatedMonsters.find(m => m.specialType === 'breath' && m.hp > 0);
      if (dragon && dragon.roundsAlive === 1) {
        // Breath weapon: D20 roll hits all heroes
        const breathRoll = Math.floor(Math.random() * 20) + 1;
        let breathDmg = 0;
        if (breathRoll === 1) breathDmg = 1;
        else if (breathRoll === 20) breathDmg = 5;
        if (breathDmg > 0) {
          updatedHeroes = updatedHeroes.map(h => ({ ...h, hp: h.hp - breathDmg }));
          logs.push(createLog(`🔥 Dragon Breath! Rolled ${breathRoll} → ${breathDmg} damage to ALL heroes!`, 'damage'));
        }
      }

      // Each living monster attacks nearest hero
      updatedMonsters.filter(m => m.hp > 0).forEach(monster => {
        const aliveHeroes = updatedHeroes.filter(h => !h.isDown);
        if (aliveHeroes.length === 0) return;
        const targetIdx = Math.floor(Math.random() * aliveHeroes.length);
        const target = aliveHeroes[targetIdx];
        const heroIdx = updatedHeroes.indexOf(target);

        // Aegis Charm: force reroll one attack die
        let attackRolls = rollDice(monster.attackDice);
        if (target.aegisCharmUsed === false && target.inventory.some(i => i.name === 'Aegis Charm' && !i.used)) {
          const aegisItemIdx = target.inventory.findIndex(i => i.name === 'Aegis Charm' && !i.used);
          if (aegisItemIdx >= 0) {
            const newInv = [...target.inventory];
            newInv[aegisItemIdx] = { ...newInv[aegisItemIdx], used: true };
            updatedHeroes[heroIdx] = { ...updatedHeroes[heroIdx], inventory: newInv };
            // Reroll highest die
            const highestIdx = attackRolls.reduce((maxI, r, i, arr) => r.hits > arr[maxI].hits ? i : maxI, 0);
            const rerolled = rollDice([attackRolls[highestIdx].type]);
            attackRolls[highestIdx] = rerolled[0];
            logs.push(createLog(`🛡 Aegis Charm! ${monster.name}'s highest die rerolled.`, 'action'));
          }
        }

        let hits = attackRolls.reduce((sum, r) => sum + r.hits, 0);

        // Hero defense
        let defenseDice = [...updatedHeroes[heroIdx].armorDice];
        if (updatedHeroes[heroIdx].shadowCloak) defenseDice = [...defenseDice, ...updatedHeroes[heroIdx].reserveDice];
        const defRolls = rollDice(defenseDice);
        let blocks = defRolls.reduce((sum, r) => {
          if (r.result === 'crown') return sum + 2;
          if (r.result === 'ace') return sum + 1;
          return sum;
        }, 0);

        // Shield Fragment
        const shieldIdx = updatedHeroes[heroIdx].inventory.findIndex(i => i.name === 'Shield Fragment' && !i.used);
        if (shieldIdx >= 0) {
          blocks += 1;
          const newInv = [...updatedHeroes[heroIdx].inventory];
          newInv[shieldIdx] = { ...newInv[shieldIdx], used: true };
          updatedHeroes[heroIdx] = { ...updatedHeroes[heroIdx], inventory: newInv };
          logs.push(createLog(`🛡 Shield Fragment: +1 Block`, 'action'));
        }

        // Mirror Shield reflect
        if (updatedHeroes[heroIdx].mirrorShieldUsed === false && updatedHeroes[heroIdx].inventory.some(i => i.name === 'Mirror Shield' && !i.used)) {
          const mirrorIdx = updatedHeroes[heroIdx].inventory.findIndex(i => i.name === 'Mirror Shield' && !i.used);
          if (mirrorIdx >= 0) {
            const newInv = [...updatedHeroes[heroIdx].inventory];
            newInv[mirrorIdx] = { ...newInv[mirrorIdx], used: true };
            updatedHeroes[heroIdx] = { ...updatedHeroes[heroIdx], inventory: newInv, mirrorShieldUsed: true };
            // Reflect damage back
            const monsterIdx = updatedMonsters.indexOf(monster);
            updatedMonsters[monsterIdx] = { ...updatedMonsters[monsterIdx], hp: updatedMonsters[monsterIdx].hp - hits };
            logs.push(createLog(`🪞 Mirror Shield! Reflected ${hits} damage back at ${monster.name}!`, 'action'));
            hits = 0;
          }
        }

        // Web effect
        if (monster.specialType === 'web') {
          const crownAttack = attackRolls.some(r => r.result === 'crown');
          if (crownAttack) {
            updatedHeroes[heroIdx] = {
              ...updatedHeroes[heroIdx],
              statusEffects: [...updatedHeroes[heroIdx].statusEffects, { type: 'webbed', roundsLeft: 1 }],
            };
            logs.push(createLog(`🕸 WEB! ${target.class} movement reduced to 1 for 1 round.`, 'damage'));
          }
        }

        // Curse effect
        if (monster.specialType === 'curse') {
          const crownAttack = attackRolls.some(r => r.result === 'crown');
          if (crownAttack && updatedHeroes[heroIdx].inventory.length > 0) {
            const newInv = [...updatedHeroes[heroIdx].inventory];
            newInv.splice(0, 1); // remove first item
            updatedHeroes[heroIdx] = { ...updatedHeroes[heroIdx], inventory: newInv };
            logs.push(createLog(`💀 CURSE! ${target.class} loses a loot item!`, 'damage'));
          }
        }

        const damage = Math.max(0, hits - blocks);
        let newHp = updatedHeroes[heroIdx].hp - damage;
        let isDown = false;

        if (newHp <= 0) {
          // Phoenix Tears
          const phoenixIdx = updatedHeroes[heroIdx].inventory.findIndex(i => i.name === 'Phoenix Tears' && !i.used);
          if (phoenixIdx >= 0) {
            const newInv = [...updatedHeroes[heroIdx].inventory];
            newInv[phoenixIdx] = { ...newInv[phoenixIdx], used: true };
            updatedHeroes[heroIdx] = { ...updatedHeroes[heroIdx], inventory: newInv };
            newHp = 4;
            logs.push(createLog(`🔥 Phoenix Tears! ${target.class} auto-revives with 4 HP!`, 'heal'));
          } else {
            newHp = 0;
            isDown = true;
            logs.push(createLog(`💀 ${target.class} is DOWNED!`, 'death'));
          }
        }

        updatedHeroes[heroIdx] = { ...updatedHeroes[heroIdx], hp: newHp, isDown };
        if (damage > 0) logs.push(createLog(`⚔ ${monster.name} hits ${target.class}: ${hits} hits, ${blocks} blocked → ${damage} damage`, 'damage'));
        else logs.push(createLog(`🛡 ${target.class} blocks ${monster.name}'s attack completely!`, 'action'));
      });

      // Check TPK
      const allDown = updatedHeroes.every(h => h.isDown);
      if (allDown) {
        return {
          ...state,
          heroes: updatedHeroes,
          currentRoom: { ...state.currentRoom, monsters: updatedMonsters },
          log: [...logs, createLog('💀 TOTAL PARTY KILL! All unbanked XP is lost.', 'death')],
          phase: 'game-over',
          gameOverReason: 'Total Party Kill — all heroes were downed.',
        };
      }

      return {
        ...state,
        heroes: updatedHeroes,
        currentRoom: { ...state.currentRoom, monsters: updatedMonsters },
        log: logs,
        combatPhase: 'player-turn',
        activeHeroIndex: 0,
      };
    }

    case 'USE_ITEM': {
      const hero = state.heroes[action.heroIndex];
      const itemIdx = hero.inventory.findIndex(i => i.id === action.itemId && !i.used);
      if (itemIdx < 0) return state;

      const item = hero.inventory[itemIdx];
      const logs = [...state.log];
      let updatedHero = { ...hero };
      const updatedHeroes = [...state.heroes];

      if (item.name === 'Minor Healing Potion') {
        updatedHero = { ...updatedHero, hp: Math.min(updatedHero.maxHp, updatedHero.hp + 2) };
        logs.push(createLog(`💊 ${hero.class} uses Minor Healing Potion: +2 HP`, 'heal'));
      } else if (item.name === 'Major Healing Potion') {
        updatedHero = { ...updatedHero, hp: Math.min(updatedHero.maxHp, updatedHero.hp + 5) };
        logs.push(createLog(`💊 ${hero.class} uses Major Healing Potion: +5 HP`, 'heal'));
      } else if (item.name === 'Potion of Fortitude') {
        updatedHero = { ...updatedHero, maxHp: updatedHero.maxHp + 2, hp: updatedHero.hp + 2 };
        logs.push(createLog(`💊 ${hero.class} uses Potion of Fortitude: +2 max HP permanently!`, 'heal'));
      } else if (item.name === 'Banking Token') {
        const banked = updatedHero.xp;
        updatedHero = { ...updatedHero, bankedXp: updatedHero.bankedXp + banked, xp: 0 };
        logs.push(createLog(`💰 Banking Token! ${hero.class} banks ${banked} XP safely!`, 'loot'));
      } else if (item.name === 'Enchanted Weapon') {
        // Upgrade first weapon die
        const dieOrder: DieType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];
        const newWeapon = [...updatedHero.weaponDice];
        const upgradeIdx = newWeapon.findIndex(d => dieOrder.indexOf(d) < dieOrder.length - 1);
        if (upgradeIdx >= 0) {
          const nextDie = dieOrder[dieOrder.indexOf(newWeapon[upgradeIdx]) + 1];
          newWeapon[upgradeIdx] = nextDie;
          updatedHero = { ...updatedHero, weaponDice: newWeapon };
          logs.push(createLog(`⚔ Enchanted Weapon: Upgraded weapon die!`, 'loot'));
        }
      } else if (item.name === 'Chainmail Patch') {
        updatedHero = { ...updatedHero, armorDice: [...updatedHero.armorDice, 'D6'] };
        logs.push(createLog(`🛡 Chainmail Patch: Added D6 to armor pool!`, 'loot'));
      } else if (item.name === 'Vorpal Edge') {
        updatedHero = { ...updatedHero, vorpalEdge: true };
        logs.push(createLog(`⚔ Vorpal Edge: Crowns deal +2 extra Hits for the Delve!`, 'loot'));
      } else if (item.name === 'Cursed Blade') {
        updatedHero = { ...updatedHero, weaponDice: [...updatedHero.weaponDice, 'D20'], cursedBlade: true };
        logs.push(createLog(`⚔ Cursed Blade: Added D20 to weapon pool (Prism = 1 self-damage)!`, 'loot'));
      } else if (item.name === 'Runic Greataxe') {
        updatedHero = { ...updatedHero, weaponDice: ['D10', 'D12'] };
        logs.push(createLog(`⚔ Runic Greataxe: Weapon pool replaced with D10+D12!`, 'loot'));
      } else if (item.name === 'Throwing Knives') {
        updatedHero = { ...updatedHero, throwingKnives: true };
        logs.push(createLog(`🗡 Throwing Knives equipped: Ranged D4+D6 attack available!`, 'loot'));
      } else if (item.name === 'Shadow Cloak') {
        updatedHero = { ...updatedHero, shadowCloak: true };
        logs.push(createLog(`🌑 Shadow Cloak: Reserve Dice can now be used for defense!`, 'loot'));
      } else if (item.name === 'Adamantine Plate') {
        updatedHero = { ...updatedHero, armorDice: ['D8', 'D10', 'D12'] };
        logs.push(createLog(`🛡 Adamantine Plate: Armor pool replaced with D8+D10+D12!`, 'loot'));
      } else if (item.name === 'Prismatic Blade') {
        updatedHero = { ...updatedHero, prismaticBladeUsed: false };
        logs.push(createLog(`⚔ Prismatic Blade equipped: Once per room, reroll one missed weapon die.`, 'loot'));
      } else if (item.name === 'Gold Pouch') {
        updatedHero = { ...updatedHero, bankedXp: updatedHero.bankedXp + 10 };
        logs.push(createLog(`💰 Gold Pouch: +10 XP banked immediately!`, 'loot'));
      } else if (item.name === 'Gemstone Cache') {
        updatedHero = { ...updatedHero, bankedXp: updatedHero.bankedXp + 25 };
        logs.push(createLog(`💰 Gemstone Cache: +25 XP banked immediately!`, 'loot'));
      } else if (item.name === 'Golden Idol') {
        updatedHero = { ...updatedHero, bankedXp: updatedHero.bankedXp + 50 };
        logs.push(createLog(`💰 Golden Idol: +50 XP banked immediately!`, 'loot'));
      }

      // Mark item as used
      const newInv = [...updatedHero.inventory];
      newInv[itemIdx] = { ...newInv[itemIdx], used: true };
      updatedHero = { ...updatedHero, inventory: newInv };
      updatedHeroes[action.heroIndex] = updatedHero;

      return { ...state, heroes: updatedHeroes, log: logs };
    }

    case 'DRAW_LOOT': {
      if (state.pendingLootDraws <= 0) return state;
      const item = drawLootCard();
      const logs = [...state.log];
      const updatedHeroes = [...state.heroes];
      let hero = { ...updatedHeroes[action.heroIndex] };

      // Auto-apply permanent XP items
      if (item.name === 'Gold Pouch') {
        hero = { ...hero, bankedXp: hero.bankedXp + 10 };
        logs.push(createLog(`💰 Drew Gold Pouch: +10 XP banked!`, 'loot'));
      } else if (item.name === 'Gemstone Cache') {
        hero = { ...hero, bankedXp: hero.bankedXp + 25 };
        logs.push(createLog(`💰 Drew Gemstone Cache: +25 XP banked!`, 'loot'));
      } else if (item.name === 'Golden Idol') {
        hero = { ...hero, bankedXp: hero.bankedXp + 50 };
        logs.push(createLog(`💰 Drew Golden Idol: +50 XP banked!`, 'loot'));
      } else {
        hero = { ...hero, inventory: [...hero.inventory, item] };
        logs.push(createLog(`✦ Drew: ${item.name} — ${item.effect}`, 'loot'));
      }

      updatedHeroes[action.heroIndex] = hero;
      const remaining = state.pendingLootDraws - 1;

      return {
        ...state,
        heroes: updatedHeroes,
        pendingLootDraws: remaining,
        log: logs,
        phase: remaining > 0 ? 'loot' : (state.currentRoom?.cleared ? 'dungeon' : 'combat'),
      };
    }

    case 'HEAL_ALLY': {
      const healer = state.heroes[action.healerIndex];
      if (healer.class !== 'Warden' || healer.specialUsed) return state;

      const healRolls = rollDice(['D4', 'D6']);
      const healAmount = healRolls.reduce((sum, r) => {
        if (r.result === 'crown') return sum + 2;
        if (r.result === 'ace') return sum + 1;
        return sum;
      }, 0);

      const logs = [...state.log];
      const updatedHeroes = [...state.heroes];
      const target = updatedHeroes[action.targetIndex];

      if (healAmount === 0) {
        logs.push(createLog(`💊 PRISM on heal! Warden's MEND fails — 0 HP restored.`, 'prism'));
      } else {
        updatedHeroes[action.targetIndex] = { ...target, hp: Math.min(target.maxHp, target.hp + healAmount) };
        logs.push(createLog(`💊 Warden MEND: +${healAmount} HP to ${target.class}`, 'heal'));
      }

      updatedHeroes[action.healerIndex] = { ...healer, specialUsed: true };
      return { ...state, heroes: updatedHeroes, log: logs };
    }

    case 'REVIVE_ALLY': {
      const reviver = state.heroes[action.reviverIndex];
      const target = state.heroes[action.targetIndex];
      if (!target.isDown) return state;

      const reviveRolls = rollDice(['D4', 'D6']);
      const reviveHits = reviveRolls.reduce((sum, r) => sum + r.hits, 0);
      const logs = [...state.log];
      const updatedHeroes = [...state.heroes];

      if (reviveHits === 0) {
        logs.push(createLog(`💊 Revival failed! Both dice missed. Try again next turn.`, 'prism'));
      } else {
        updatedHeroes[action.targetIndex] = { ...target, hp: reviveHits, isDown: false };
        logs.push(createLog(`💊 ${reviver.class} revives ${target.class} with ${reviveHits} HP!`, 'heal'));
      }

      return { ...state, heroes: updatedHeroes, log: logs };
    }

    case 'USE_SPECIAL': {
      const hero = state.heroes[action.heroIndex];
      if (hero.specialUsed) return state;

      const logs = [...state.log];
      const updatedHeroes = [...state.heroes];

      if (hero.class === 'Ironclad') {
        // BULWARK: roll armor dice for adjacent ally
        if (action.targetIndex !== undefined) {
          const target = updatedHeroes[action.targetIndex];
          const armorRolls = rollDice(hero.armorDice);
          const blocks = armorRolls.reduce((sum, r) => {
            if (r.result === 'crown') return sum + 2;
            if (r.result === 'ace') return sum + 1;
            return sum;
          }, 0);
          logs.push(createLog(`🛡 BULWARK! Ironclad shields ${target.class} — ${blocks} blocks applied.`, 'action'));
        }
        updatedHeroes[action.heroIndex] = { ...hero, specialUsed: true };
      } else if (hero.class === 'Shade') {
        // AMBUSH: handled in attack logic
        logs.push(createLog(`🗡 AMBUSH ready! Shade's first attack this room will score all Aces.`, 'action'));
        updatedHeroes[action.heroIndex] = { ...hero, specialUsed: true };
      } else if (hero.class === 'Warden') {
        // MEND: handled in HEAL_ALLY
        logs.push(createLog(`💊 Warden MEND: Choose an ally to heal.`, 'action'));
      } else if (hero.class === 'Arcanist') {
        // SPELLCAST: handled in ATTACK with spellDice
        logs.push(createLog(`🔮 Spellcast ready! Choose Reserve Dice to cast a spell.`, 'action'));
      }

      return { ...state, heroes: updatedHeroes, log: logs };
    }

    case 'SEARCH_ROOM': {
      if (!state.currentRoom || !state.currentRoom.cleared) return state;
      const logs = [...state.log];

      // Mimic check
      const hasMimic = Math.random() < 0.1; // 10% chance of mimic
      if (hasMimic && state.depth >= 2) {
        const mimicTemplate = MONSTER_TEMPLATES.find(m => m.name === 'Mimic')!;
        const mimic = createMonster(mimicTemplate);
        const updatedRoom = { ...state.currentRoom, monsters: [mimic], cleared: false };
        logs.push(createLog(`⚠ MIMIC! A chest reveals itself as a monster! ${state.heroes[action.heroIndex].class} loses their action.`, 'damage'));
        return { ...state, currentRoom: updatedRoom, log: logs, phase: 'combat', combatPhase: 'monster-turn' };
      }

      // Trap check for trapped passage
      if (state.currentRoom.type === 'trapped-passage' && !state.currentRoom.trapTriggered) {
        const { rolls, passed } = trapCheck();
        const updatedRoom = { ...state.currentRoom, trapTriggered: true };
        if (!passed) {
          const updatedHeroes = [...state.heroes];
          updatedHeroes[action.heroIndex] = { ...updatedHeroes[action.heroIndex], hp: updatedHeroes[action.heroIndex].hp - 3 };
          logs.push(createLog(`⚠ TRAP! ${state.heroes[action.heroIndex].class} fails the trap check — 3 damage!`, 'damage'));
          return { ...state, currentRoom: updatedRoom, heroes: updatedHeroes, log: logs, pendingLootDraws: 1, phase: 'loot' };
        } else {
          logs.push(createLog(`✦ Trap disarmed! ${state.heroes[action.heroIndex].class} finds a locked chest.`, 'system'));
          return { ...state, currentRoom: updatedRoom, log: logs, pendingLootDraws: 1, phase: 'loot' };
        }
      }

      logs.push(createLog(`🔍 ${state.heroes[action.heroIndex].class} searches the room... nothing more found.`, 'system'));
      return { ...state, log: logs };
    }

    case 'BANK_XP': {
      const logs = [...state.log];
      const updatedHeroes = state.heroes.map(h => {
        const newBanked = h.bankedXp + h.xp;
        const newLevel = getLevel(newBanked);
        if (newLevel > h.level) {
          logs.push(createLog(`⬆ ${h.class} leveled up to Level ${newLevel}! +2 max HP, upgrade a die.`, 'crown'));
        }
        return { ...h, bankedXp: newBanked, xp: 0, level: newLevel, specialUsed: false };
      });
      const total = updatedHeroes.reduce((sum, h) => sum + h.bankedXp, 0);
      logs.push(createLog(`💰 XP Banked! Party total: ${total} XP`, 'loot'));
      return { ...state, heroes: updatedHeroes, log: logs };
    }

    case 'RETREAT': {
      const logs = [...state.log];
      // Bank all XP on retreat
      const updatedHeroes = state.heroes.map(h => {
        const newBanked = h.bankedXp + h.xp;
        const newLevel = getLevel(newBanked);
        return { ...h, bankedXp: newBanked, xp: 0, level: newLevel };
      });
      const totalBanked = updatedHeroes.reduce((sum, h) => sum + h.bankedXp, 0);
      logs.push(createLog(`🏃 Party retreats to the surface! All XP banked. Total: ${totalBanked}`, 'system'));

      // Crown of Greed check
      const allSafe = state.heroes.every(h => !h.isDown);
      updatedHeroes.forEach(h => {
        const crownIdx = h.inventory.findIndex(i => i.name === 'Crown of Greed' && !i.used);
        if (crownIdx >= 0 && allSafe) {
          h.bankedXp += 100;
          logs.push(createLog(`👑 Crown of Greed! +100 XP for ${h.class} (successful retreat)!`, 'crown'));
        }
      });

      return {
        ...state,
        heroes: updatedHeroes,
        log: logs,
        phase: 'victory',
        victoryReason: `Party retreated safely with ${totalBanked} total banked XP!`,
        delveScore: totalBanked,
      };
    }

    case 'DESCEND': {
      if (state.depth >= 3) return state;
      const newDepth = (state.depth + 1) as Depth;
      const logs = [...state.log];
      logs.push(createLog(`⬇ Descending to Depth ${newDepth}! Monsters are stronger, loot is richer.`, 'system'));
      // Reset per-room specials
      const updatedHeroes = state.heroes.map(h => ({ ...h, specialUsed: false }));
      return { ...state, depth: newDepth, heroes: updatedHeroes, log: logs };
    }

    case 'NEXT_HERO_TURN': {
      const next = (state.activeHeroIndex + 1) % state.heroes.length;
      const logs = [...state.log];
      // Reset per-room specials when cycling back to first hero
      let updatedHeroes = [...state.heroes];
      if (next === 0) {
        // All heroes done — monster phase
        return { ...state, activeHeroIndex: next, combatPhase: 'monster-turn', log: logs };
      }
      return { ...state, activeHeroIndex: next, log: logs };
    }

    case 'ADD_LOG': {
      return { ...state, log: [...state.log, createLog(action.text, action.logType)] };
    }

    case 'RESET_GAME': {
      return initGameState([]);
    }

    default:
      return state;
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initGameState([]));

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
