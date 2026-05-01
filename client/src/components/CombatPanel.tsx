// ============================================================
// PRISMATIC DEPTHS — CombatPanel Component
// Design: Neon Dungeon Terminal — main combat interface
// ============================================================

import { useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { DieType, DieRoll, rollDice, checkComboBonuses, DIE_CONFIG } from '@/lib/gameEngine';
import DiceRoller, { DieSelector } from './DiceRoller';
import MonsterCard from './MonsterCard';
import HeroCard from './HeroCard';
import { cn } from '@/lib/utils';

type CombatAction = 'attack' | 'spell' | 'heal' | 'revive' | 'item' | null;

export default function CombatPanel() {
  const { state, dispatch } = useGame();
  const { heroes, currentRoom, activeHeroIndex, combatPhase, isSurpriseRound } = state;

  const [selectedMonster, setSelectedMonster] = useState(0);
  const [selectedReserveDie, setSelectedReserveDie] = useState<DieType | null>(null);
  const [selectedSpellDice, setSelectedSpellDice] = useState<DieType[]>([]);
  const [selectedTargetHero, setSelectedTargetHero] = useState<number | null>(null);
  const [combatAction, setCombatAction] = useState<CombatAction>(null);
  const [lastRolls, setLastRolls] = useState<DieRoll[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPrismEffect, setShowPrismEffect] = useState(false);

  const hero = heroes[activeHeroIndex];
  const monsters = currentRoom?.monsters || [];
  const aliveMonsters = monsters.filter(m => m.hp > 0);

  const animate = useCallback((fn: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
      fn();
      setIsAnimating(false);
    }, 700);
  }, []);

  const handleAttack = () => {
    if (!hero || hero.isDown) return;
    const monster = monsters[selectedMonster];
    if (!monster || monster.hp <= 0) return;

    // Preview rolls for animation
    const previewRolls = rollDice(hero.weaponDice);
    setLastRolls(previewRolls);

    animate(() => {
      dispatch({
        type: 'ATTACK',
        heroIndex: activeHeroIndex,
        monsterIndex: selectedMonster,
        reserveDie: selectedReserveDie || undefined,
      });
      setSelectedReserveDie(null);
    });
  };

  const handleSpellcast = () => {
    if (!hero || hero.isDown || selectedSpellDice.length === 0) return;

    const previewRolls = rollDice(selectedSpellDice);
    setLastRolls(previewRolls);

    animate(() => {
      dispatch({
        type: 'ATTACK',
        heroIndex: activeHeroIndex,
        monsterIndex: selectedMonster,
        spellDice: selectedSpellDice,
      });
      setSelectedSpellDice([]);
    });
  };

  const handleMonsterPhase = () => {
    animate(() => {
      dispatch({ type: 'MONSTER_ATTACK_PHASE' });
    });
  };

  const handleNextTurn = () => {
    dispatch({ type: 'NEXT_HERO_TURN' });
    setSelectedReserveDie(null);
    setSelectedSpellDice([]);
    setCombatAction(null);
  };

  const handleHeal = () => {
    if (selectedTargetHero === null) return;
    dispatch({ type: 'HEAL_ALLY', healerIndex: activeHeroIndex, targetIndex: selectedTargetHero });
    setSelectedTargetHero(null);
    setCombatAction(null);
  };

  const handleRevive = () => {
    if (selectedTargetHero === null) return;
    dispatch({ type: 'REVIVE_ALLY', reviverIndex: activeHeroIndex, targetIndex: selectedTargetHero });
    setSelectedTargetHero(null);
    setCombatAction(null);
  };

  const isPlayerTurn = combatPhase === 'player-turn';
  const isMonsterTurn = combatPhase === 'monster-turn';

  return (
    <div className={cn('space-y-4', showPrismEffect && 'prism-glitch')}>
      {/* Phase indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider"
            style={{
              background: isPlayerTurn ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${isPlayerTurn ? 'rgba(6,182,212,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: isPlayerTurn ? '#22d3ee' : '#f87171',
            }}
          >
            {isPlayerTurn ? `${hero?.class}'s Turn` : '⚔ Monster Phase'}
          </div>
          {isSurpriseRound && (
            <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
              ⚠ AMBUSH
            </div>
          )}
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Depth {state.depth} · Room {state.roomNumber}
        </div>
      </div>

      {/* Monsters */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Enemies</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {monsters.map((monster, i) => (
            <MonsterCard
              key={monster.id}
              monster={monster}
              compact
              selected={selectedMonster === i && monster.hp > 0}
              onClick={() => monster.hp > 0 && setSelectedMonster(i)}
            />
          ))}
        </div>
      </div>

      {/* Combat actions — player turn */}
      {isPlayerTurn && hero && !hero.isDown && (
        <div className="space-y-3">
          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ActionButton
              label="⚔ Attack"
              active={combatAction === 'attack'}
              color="#22d3ee"
              onClick={() => setCombatAction(combatAction === 'attack' ? null : 'attack')}
              disabled={aliveMonsters.length === 0}
            />
            {hero.class === 'Arcanist' && (
              <ActionButton
                label="🔮 Spellcast"
                active={combatAction === 'spell'}
                color="#4ade80"
                onClick={() => setCombatAction(combatAction === 'spell' ? null : 'spell')}
                disabled={aliveMonsters.length === 0}
              />
            )}
            {hero.class === 'Warden' && !hero.specialUsed && (
              <ActionButton
                label="💊 Mend"
                active={combatAction === 'heal'}
                color="#4ade80"
                onClick={() => setCombatAction(combatAction === 'heal' ? null : 'heal')}
              />
            )}
            {heroes.some(h => h.isDown) && (
              <ActionButton
                label="💉 Revive"
                active={combatAction === 'revive'}
                color="#fbbf24"
                onClick={() => setCombatAction(combatAction === 'revive' ? null : 'revive')}
              />
            )}
            <ActionButton
              label="➡ End Turn"
              active={false}
              color="#6b7280"
              onClick={handleNextTurn}
            />
          </div>

          {/* Attack panel */}
          {combatAction === 'attack' && (
            <div className="rounded border p-3 space-y-3" style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.2)' }}>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Attack Configuration</div>

              {/* Weapon dice display */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Weapon Dice</div>
                <div className="flex gap-1 flex-wrap">
                  {hero.weaponDice.map((d, i) => (
                    <div key={i} className="px-2 py-1 rounded border text-xs font-mono font-bold"
                      style={{ background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* Press with reserve die */}
              <DieSelector
                availableDice={hero.reserveDice}
                selectedDice={selectedReserveDie ? [selectedReserveDie] : []}
                onToggle={(d) => setSelectedReserveDie(selectedReserveDie === d ? null : d)}
                label="Press with Reserve Die (optional — risky!)"
                maxSelect={1}
              />

              {selectedReserveDie && (
                <div className="text-xs rounded p-2" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                  ⚠ Pressing with {selectedReserveDie}: {Math.round((1 - 2/DIE_CONFIG[selectedReserveDie].sides) * 100)}% chance of PRISM — lose ALL hits!
                </div>
              )}

              <button
                onClick={handleAttack}
                disabled={isAnimating}
                className={cn(
                  'w-full py-2.5 rounded font-bold text-sm transition-all duration-300',
                  isAnimating ? 'opacity-60' : 'hover:scale-[1.01]',
                )}
                style={{
                  background: 'rgba(6,182,212,0.2)',
                  border: '1px solid rgba(6,182,212,0.5)',
                  color: '#22d3ee',
                  boxShadow: isAnimating ? 'none' : '0 0 16px rgba(6,182,212,0.2)',
                }}
              >
                {isAnimating ? '🎲 Rolling...' : `⚔ Attack ${monsters[selectedMonster]?.name || 'Target'}`}
              </button>
            </div>
          )}

          {/* Spellcast panel */}
          {combatAction === 'spell' && hero.class === 'Arcanist' && (
            <div className="rounded border p-3 space-y-3" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
              <div className="text-xs font-mono text-green-400 uppercase tracking-wider">Spellcast — Choose Reserve Dice</div>

              <DieSelector
                availableDice={hero.reserveDice}
                selectedDice={selectedSpellDice}
                onToggle={(d) => {
                  setSelectedSpellDice(prev =>
                    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                  );
                }}
                label="Spell Dice (Crown Hits deal TRIPLE damage)"
              />

              {selectedSpellDice.length > 0 && (
                <div className="text-xs rounded p-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                  {selectedSpellDice.length} dice selected. Backfire chance: ~{Math.round(Math.pow(1 - 2/6, selectedSpellDice.length) * 100)}%
                </div>
              )}

              <button
                onClick={handleSpellcast}
                disabled={isAnimating || selectedSpellDice.length === 0}
                className={cn(
                  'w-full py-2.5 rounded font-bold text-sm transition-all duration-300',
                  (isAnimating || selectedSpellDice.length === 0) ? 'opacity-40' : 'hover:scale-[1.01]',
                )}
                style={{
                  background: 'rgba(34,197,94,0.2)',
                  border: '1px solid rgba(34,197,94,0.5)',
                  color: '#4ade80',
                  boxShadow: selectedSpellDice.length > 0 ? '0 0 16px rgba(34,197,94,0.2)' : 'none',
                }}
              >
                {isAnimating ? '🔮 Casting...' : `🔮 Cast Spell (${selectedSpellDice.length} dice)`}
              </button>
            </div>
          )}

          {/* Heal panel */}
          {combatAction === 'heal' && hero.class === 'Warden' && (
            <div className="rounded border p-3 space-y-3" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
              <div className="text-xs font-mono text-green-400 uppercase tracking-wider">MEND — Choose Target</div>
              <div className="grid grid-cols-2 gap-2">
                {heroes.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTargetHero(selectedTargetHero === i ? null : i)}
                    className={cn(
                      'p-2 rounded border text-xs font-bold transition-all',
                      selectedTargetHero === i ? 'scale-105' : 'opacity-60',
                    )}
                    style={{
                      background: selectedTargetHero === i ? 'rgba(34,197,94,0.2)' : 'transparent',
                      borderColor: selectedTargetHero === i ? '#22c55e' : 'rgba(255,255,255,0.15)',
                      color: selectedTargetHero === i ? '#4ade80' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {h.class} ({h.hp}/{h.maxHp} HP)
                  </button>
                ))}
              </div>
              <button
                onClick={handleHeal}
                disabled={selectedTargetHero === null}
                className="w-full py-2 rounded font-bold text-sm disabled:opacity-40"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)', color: '#4ade80' }}
              >
                💊 Heal Target
              </button>
            </div>
          )}

          {/* Revive panel */}
          {combatAction === 'revive' && (
            <div className="rounded border p-3 space-y-3" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">Revive Downed Hero</div>
              <div className="grid grid-cols-2 gap-2">
                {heroes.filter(h => h.isDown).map((h, i) => {
                  const heroIdx = heroes.indexOf(h);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedTargetHero(heroIdx)}
                      className={cn(
                        'p-2 rounded border text-xs font-bold transition-all',
                        selectedTargetHero === heroIdx ? 'scale-105' : 'opacity-60',
                      )}
                      style={{
                        background: selectedTargetHero === heroIdx ? 'rgba(245,158,11,0.2)' : 'transparent',
                        borderColor: selectedTargetHero === heroIdx ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                        color: selectedTargetHero === heroIdx ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {h.class} (DOWNED)
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleRevive}
                disabled={selectedTargetHero === null}
                className="w-full py-2 rounded font-bold text-sm disabled:opacity-40"
                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', color: '#fbbf24' }}
              >
                💉 Attempt Revival
              </button>
            </div>
          )}
        </div>
      )}

      {/* Monster turn */}
      {isMonsterTurn && (
        <div className="space-y-3">
          <div className="rounded border p-3 text-center" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="text-red-400 font-bold mb-1">Monster Phase</div>
            <div className="text-xs text-muted-foreground">All living monsters attack the nearest hero</div>
          </div>
          <button
            onClick={handleMonsterPhase}
            disabled={isAnimating}
            className={cn(
              'w-full py-3 rounded font-bold text-sm transition-all duration-300',
              isAnimating ? 'opacity-60' : 'hover:scale-[1.01]',
            )}
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.5)',
              color: '#f87171',
              boxShadow: isAnimating ? 'none' : '0 0 16px rgba(239,68,68,0.2)',
            }}
          >
            {isAnimating ? '⚔ Monsters attacking...' : '⚔ Resolve Monster Attacks'}
          </button>
        </div>
      )}

      {/* Downed hero message */}
      {hero?.isDown && isPlayerTurn && (
        <div className="rounded border p-3 text-center" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="text-red-400 font-bold">💀 {hero.class} is DOWNED</div>
          <div className="text-xs text-muted-foreground mt-1">Another hero must revive them</div>
          <button
            onClick={handleNextTurn}
            className="mt-2 px-4 py-1.5 rounded text-xs font-bold"
            style={{ background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.4)', color: '#9ca3af' }}
          >
            Skip Turn
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ACTION BUTTON ────────────────────────────────────────────
function ActionButton({ label, active, color, onClick, disabled }: {
  label: string; active: boolean; color: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'py-2 px-3 rounded border text-xs font-bold transition-all duration-200',
        active ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100',
        disabled && 'opacity-20 cursor-not-allowed',
      )}
      style={{
        background: active ? `${color}20` : 'transparent',
        borderColor: active ? color : 'rgba(255,255,255,0.15)',
        color: active ? color : 'rgba(255,255,255,0.6)',
        boxShadow: active ? `0 0 10px ${color}30` : 'none',
      }}
    >
      {label}
    </button>
  );
}
