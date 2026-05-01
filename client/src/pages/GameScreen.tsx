// ============================================================
// PRISMATIC DEPTHS — Main Game Screen
// Design: Neon Dungeon Terminal — asymmetric split layout
// Left: dungeon info + log | Right: heroes + actions
// ============================================================

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ROOM_TYPE_LABELS, ROOM_TYPE_COLORS } from '@/lib/gameEngine';
import HeroCard from '@/components/HeroCard';
import MonsterCard from '@/components/MonsterCard';
import CombatPanel from '@/components/CombatPanel';
import GameLog from '@/components/GameLog';
import { LootDrawPanel, InventoryPanel } from '@/components/LootPanel';
import { cn } from '@/lib/utils';

export default function GameScreen() {
  const { state, dispatch } = useGame();
  const { heroes, currentRoom, phase, depth, roomNumber, pendingLootDraws, activeHeroIndex, log } = state;
  const [showInventory, setShowInventory] = useState<number | null>(null);
  const [isExploring, setIsExploring] = useState(false);

  const handleExplore = () => {
    setIsExploring(true);
    setTimeout(() => {
      dispatch({ type: 'EXPLORE_ROOM' });
      setIsExploring(false);
    }, 800);
  };

  const handleDescend = () => dispatch({ type: 'DESCEND' });
  const handleRetreat = () => dispatch({ type: 'RETREAT' });
  const handleBankXP = () => dispatch({ type: 'BANK_XP' });

  const totalUnbankedXP = heroes.reduce((sum, h) => sum + h.xp, 0);
  const totalBankedXP = heroes.reduce((sum, h) => sum + h.bankedXp, 0);

  const depthColors = {
    1: { label: 'Depth 1 — The Shallows', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    2: { label: 'Depth 2 — The Abyss',   color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)' },
    3: { label: 'Depth 3 — The Void',     color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
  }[depth];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.07 0.01 270)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ background: 'rgba(5,5,12,0.95)', borderColor: 'rgba(6,182,212,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm" style={{ fontFamily: 'Cinzel Decorative, serif', color: '#22d3ee' }}>
            PRISMATIC DEPTHS
          </span>
          <div className="px-2 py-0.5 rounded border text-xs font-mono" style={{ background: depthColors.bg, borderColor: depthColors.border, color: depthColors.color }}>
            {depthColors.label}
          </div>
          <div className="text-xs font-mono text-muted-foreground">Room {roomNumber}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono">
            <span className="text-muted-foreground">XP: </span>
            <span className="text-yellow-400">{totalBankedXP}</span>
            <span className="text-muted-foreground"> banked</span>
            {totalUnbankedXP > 0 && (
              <span className="text-purple-400"> +{totalUnbankedXP} unbanked</span>
            )}
          </div>
          <button
            onClick={handleRetreat}
            className="px-3 py-1 rounded border text-xs font-bold transition-all hover:scale-105"
            style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80' }}
          >
            🏃 Retreat
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Dungeon + Log */}
        <div className="flex flex-col w-full lg:w-[55%] border-r overflow-hidden" style={{ borderColor: 'rgba(6,182,212,0.1)' }}>

          {/* Room info */}
          <div className="p-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {currentRoom ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={cn('font-bold text-base', ROOM_TYPE_COLORS[currentRoom.type])}>
                      {ROOM_TYPE_LABELS[currentRoom.type]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {currentRoom.cleared ? '✓ Cleared' : `${currentRoom.monsters.filter(m => m.hp > 0).length} enemy(ies) remaining`}
                    </div>
                  </div>
                  {currentRoom.hasStairway && currentRoom.cleared && depth < 3 && (
                    <button
                      onClick={handleDescend}
                      className="px-3 py-1.5 rounded border text-xs font-bold transition-all hover:scale-105"
                      style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', color: '#60a5fa' }}
                    >
                      ⬇ Descend to Depth {depth + 1}
                    </button>
                  )}
                </div>

                {/* Exploration roll display */}
                {currentRoom.explorationRoll && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Exploration:</span>
                    {currentRoom.explorationRoll.map((r, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold border"
                        style={{
                          background: r.result !== 'miss' ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                          borderColor: r.result !== 'miss' ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)',
                          color: r.result !== 'miss' ? '#22d3ee' : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {r.value}
                      </div>
                    ))}
                    <span className="text-xs font-mono text-cyan-400">
                      {currentRoom.explorationRoll.filter(r => r.result !== 'miss').length} scoring
                    </span>
                  </div>
                )}

                {/* Monsters in room */}
                {currentRoom.monsters.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentRoom.monsters.map((m, i) => (
                      <MonsterCard key={m.id} monster={m} compact />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-muted-foreground text-sm">You stand at the dungeon entrance.</div>
              </div>
            )}
          </div>

          {/* Dungeon actions */}
          {phase === 'dungeon' && (
            <div className="p-4 border-b shrink-0 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleExplore}
                  disabled={isExploring}
                  className={cn(
                    'py-3 rounded border font-bold text-sm transition-all duration-300',
                    isExploring ? 'opacity-60' : 'hover:scale-[1.02]',
                  )}
                  style={{
                    background: 'rgba(6,182,212,0.15)',
                    border: '1px solid rgba(6,182,212,0.4)',
                    color: '#22d3ee',
                    boxShadow: isExploring ? 'none' : '0 0 16px rgba(6,182,212,0.15)',
                  }}
                >
                  {isExploring ? '🎲 Exploring...' : '🚪 Explore New Room'}
                </button>

                {totalUnbankedXP > 0 && (
                  <button
                    onClick={handleBankXP}
                    className="py-3 rounded border font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}
                  >
                    💰 Bank XP (+{totalUnbankedXP})
                  </button>
                )}

                <button
                  onClick={handleRetreat}
                  className="py-3 rounded border font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
                >
                  🏃 Retreat & Bank All
                </button>
              </div>

              {/* Depth info */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[1, 2, 3].map(d => (
                  <div
                    key={d}
                    className="rounded border p-2 text-center"
                    style={{
                      background: depth === d ? depthColors.bg : 'rgba(255,255,255,0.02)',
                      borderColor: depth === d ? depthColors.border : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="font-bold" style={{ color: depth === d ? depthColors.color : 'rgba(255,255,255,0.3)' }}>
                      Depth {d}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {d === 1 ? 'Tier 1 · ×1 XP' : d === 2 ? 'Tier 2 · ×2 XP' : 'Tier 3 · ×3 XP'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combat panel */}
          {phase === 'combat' && (
            <div className="p-4 border-b shrink-0 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.06)', maxHeight: '50vh' }}>
              <CombatPanel />
            </div>
          )}

          {/* Loot panel */}
          {phase === 'loot' && pendingLootDraws > 0 && (
            <div className="p-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <LootDrawPanel
                pendingDraws={pendingLootDraws}
                heroes={heroes}
                activeHeroIndex={activeHeroIndex}
              />
            </div>
          )}

          {/* Game log */}
          <div className="flex-1 p-4 overflow-hidden">
            <GameLog entries={log} maxHeight="100%" className="h-full" />
          </div>
        </div>

        {/* RIGHT PANEL — Heroes */}
        <div className="hidden lg:flex flex-col w-[45%] overflow-y-auto p-4 space-y-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Party</div>

          {heroes.map((hero, i) => (
            <div key={i} className="space-y-2">
              <HeroCard
                hero={hero}
                isActive={i === activeHeroIndex && phase === 'combat'}
                onClick={() => setShowInventory(showInventory === i ? null : i)}
              />

              {/* Inventory toggle */}
              {showInventory === i && (
                <div className="rounded border p-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                    {hero.class} Inventory
                  </div>
                  <InventoryPanel
                    hero={hero}
                    heroIndex={i}
                    inCombat={phase === 'combat'}
                  />
                </div>
              )}
            </div>
          ))}

          {/* PRISM rules quick reference */}
          <div className="rounded border p-3 mt-4" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }}>
            <div className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-2">PRISM Quick Ref</div>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <div><span className="text-white/60">ACE (roll 1)</span> = 1 Hit</div>
              <div><span className="text-white/60">CROWN (roll max)</span> = Crown Hits</div>
              <div><span className="text-white/60">MISS (anything else)</span> = 0 Hits</div>
              <div className="border-t border-white/10 pt-1 mt-1">
                <div className="text-purple-400">PRISM = press fails → lose ALL hits</div>
              </div>
              <div className="border-t border-white/10 pt-1 mt-1">
                <div className="text-amber-400">Triple Strike (3 same) = +3 Hits</div>
                <div className="text-cyan-400">Precision (4 consec.) = ignore DEF</div>
                <div className="text-yellow-400">Full Spectrum (all 6 score) = ×2 + extra action</div>
              </div>
            </div>
          </div>

          {/* Crown values */}
          <div className="rounded border p-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Crown Values</div>
            <div className="grid grid-cols-3 gap-1 text-xs font-mono">
              {[
                { die: 'D4', hits: 1, color: '#c084fc' },
                { die: 'D6', hits: 2, color: '#60a5fa' },
                { die: 'D8', hits: 2, color: '#22d3ee' },
                { die: 'D10', hits: 3, color: '#4ade80' },
                { die: 'D12', hits: 3, color: '#fbbf24' },
                { die: 'D20', hits: 5, color: '#f87171' },
              ].map(d => (
                <div key={d.die} className="flex justify-between px-1.5 py-0.5 rounded" style={{ background: `${d.color}10` }}>
                  <span style={{ color: d.color }}>{d.die}</span>
                  <span className="text-white/60">{d.hits}H</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero strip */}
      <div className="lg:hidden flex gap-2 p-2 border-t overflow-x-auto shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,5,12,0.95)' }}>
        {heroes.map((hero, i) => (
          <div key={i} className="w-40 shrink-0">
            <HeroCard
              hero={hero}
              isActive={i === activeHeroIndex && phase === 'combat'}
              compact
              onClick={() => setShowInventory(showInventory === i ? null : i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
