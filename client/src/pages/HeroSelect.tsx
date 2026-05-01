// ============================================================
// PRISMATIC DEPTHS — Hero Select Screen
// Design: Neon Dungeon Terminal — dark bg, prismatic hero cards
// ============================================================

import { useState } from 'react';
import { HeroClass } from '@/lib/gameEngine';
import { useGame } from '@/contexts/GameContext';
import { HeroSelectCard } from '@/components/HeroCard';
import { cn } from '@/lib/utils';

const ALL_HEROES: HeroClass[] = ['Ironclad', 'Shade', 'Arcanist', 'Warden'];

export default function HeroSelectScreen() {
  const { dispatch } = useGame();
  const [selectedHeroes, setSelectedHeroes] = useState<HeroClass[]>([]);
  const [soloMode, setSoloMode] = useState(false);

  const toggleHero = (heroClass: HeroClass) => {
    if (selectedHeroes.includes(heroClass)) {
      setSelectedHeroes(prev => prev.filter(h => h !== heroClass));
    } else {
      const max = soloMode ? 2 : 4;
      if (selectedHeroes.length < max) {
        setSelectedHeroes(prev => [...prev, heroClass]);
      }
    }
  };

  const canStart = soloMode ? selectedHeroes.length >= 1 && selectedHeroes.length <= 2 : selectedHeroes.length >= 1;

  const handleStart = () => {
    if (!canStart) return;
    dispatch({ type: 'START_GAME', heroClasses: selectedHeroes });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'oklch(0.06 0.01 270)' }}>
      {/* Background dungeon image */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(/manus-storage/dungeon-hero-bg_c6133964.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'saturate(1.5)',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
      }} />

      <div className="relative z-10 container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-mono tracking-[0.3em] text-cyan-400/60 mb-2 uppercase">Version 1.0</div>
          <h1
            className="text-5xl sm:text-6xl font-bold mb-2"
            style={{
              fontFamily: 'Cinzel Decorative, serif',
              background: 'linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4, #22c55e, #f59e0b, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.4))',
            }}
          >
            PRISMATIC DEPTHS
          </h1>
          <p className="text-sm text-white/50 font-mono italic">
            "Every roll is a gamble. Every room is a choice. How deep do you dare?"
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => { setSoloMode(false); setSelectedHeroes([]); }}
            className={cn(
              'px-4 py-2 rounded border text-sm font-bold transition-all',
              !soloMode ? 'scale-105' : 'opacity-50',
            )}
            style={{
              background: !soloMode ? 'rgba(6,182,212,0.15)' : 'transparent',
              borderColor: !soloMode ? '#06b6d4' : 'rgba(255,255,255,0.15)',
              color: !soloMode ? '#22d3ee' : 'rgba(255,255,255,0.4)',
            }}
          >
            Party (1–4 Heroes)
          </button>
          <button
            onClick={() => { setSoloMode(true); setSelectedHeroes([]); }}
            className={cn(
              'px-4 py-2 rounded border text-sm font-bold transition-all',
              soloMode ? 'scale-105' : 'opacity-50',
            )}
            style={{
              background: soloMode ? 'rgba(168,85,247,0.15)' : 'transparent',
              borderColor: soloMode ? '#a855f7' : 'rgba(255,255,255,0.15)',
              color: soloMode ? '#c084fc' : 'rgba(255,255,255,0.4)',
            }}
          >
            Solo Mode (1–2 Heroes)
          </button>
        </div>

        {soloMode && (
          <div className="text-center mb-4 text-xs font-mono text-purple-400/70">
            Solo adjustments: Monster HP -1 · 1 free loot draw · Ambush count -1
          </div>
        )}

        {/* Hero grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ALL_HEROES.map(heroClass => (
            <HeroSelectCard
              key={heroClass}
              heroClass={heroClass}
              selected={selectedHeroes.includes(heroClass)}
              onSelect={() => toggleHero(heroClass)}
            />
          ))}
        </div>

        {/* Selection summary */}
        <div className="flex flex-col items-center gap-4">
          {selectedHeroes.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Selected:</span>
              {selectedHeroes.map(h => (
                <span key={h} className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                  {h}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              'px-8 py-4 rounded font-bold text-lg transition-all duration-300',
              canStart ? 'hover:scale-[1.03]' : 'opacity-30 cursor-not-allowed',
            )}
            style={{
              background: canStart ? 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(168,85,247,0.3))' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${canStart ? 'rgba(6,182,212,0.6)' : 'rgba(255,255,255,0.1)'}`,
              color: canStart ? '#22d3ee' : 'rgba(255,255,255,0.3)',
              boxShadow: canStart ? '0 0 30px rgba(6,182,212,0.3), 0 0 60px rgba(168,85,247,0.15)' : 'none',
              fontFamily: 'Cinzel Decorative, serif',
            }}
          >
            {canStart ? '⬇ DESCEND INTO THE DEPTHS' : 'Select at least 1 hero'}
          </button>

          {/* Rules summary */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
            {[
              { icon: '🎲', title: 'PRISM System', desc: 'Roll dice, set aside hits, press for more — or lose everything on a PRISM.' },
              { icon: '⬇', title: '3 Depths', desc: 'Descend for better loot and XP. Retreat to bank your rewards safely.' },
              { icon: '💀', title: 'TPK Risk', desc: 'If all heroes fall, all unbanked XP is lost forever. Choose wisely.' },
            ].map(r => (
              <div key={r.title} className="rounded border p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-2xl mb-1">{r.icon}</div>
                <div className="text-xs font-bold text-white/80 mb-1">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
