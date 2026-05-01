// ============================================================
// PRISMATIC DEPTHS — Game Over & Victory Screens
// Design: Neon Dungeon Terminal
// ============================================================

import { useGame } from '@/contexts/GameContext';
import { HeroClass } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const { heroes, gameOverReason, roomNumber, depth } = state;
  const totalBanked = heroes.reduce((sum, h) => sum + h.bankedXp, 0);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'oklch(0.06 0.01 270)' }}>
      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        {/* Death icon */}
        <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.6))' }}>💀</div>

        <div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: 'Cinzel Decorative, serif',
              color: '#f87171',
              textShadow: '0 0 20px rgba(239,68,68,0.5)',
            }}
          >
            TOTAL PARTY KILL
          </h1>
          <p className="text-muted-foreground text-sm">{gameOverReason}</p>
        </div>

        {/* Stats */}
        <div className="rounded border p-4 space-y-3" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold font-mono text-red-400">{roomNumber}</div>
              <div className="text-xs text-muted-foreground">Rooms Explored</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-amber-400">{depth}</div>
              <div className="text-xs text-muted-foreground">Depth Reached</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-purple-400">{totalBanked}</div>
              <div className="text-xs text-muted-foreground">XP Banked</div>
            </div>
          </div>

          {/* Hero fates */}
          <div className="space-y-2">
            {heroes.map((hero, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="font-bold" style={{ color: hero.isDown ? '#f87171' : '#4ade80' }}>
                  {hero.class} {hero.isDown ? '💀' : '✓'}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {hero.bankedXp} XP banked · Lv.{hero.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground italic">
          "The depths claimed you. But the dungeon remembers no names."
        </div>

        <button
          onClick={() => dispatch({ type: 'RESET_GAME' })}
          className="px-8 py-3 rounded font-bold text-sm transition-all hover:scale-[1.03]"
          style={{
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.5)',
            color: '#f87171',
            fontFamily: 'Cinzel Decorative, serif',
          }}
        >
          ↺ Begin New Delve
        </button>
      </div>
    </div>
  );
}

export function VictoryScreen() {
  const { state, dispatch } = useGame();
  const { heroes, victoryReason, roomNumber, depth, delveScore } = state;
  const totalBanked = heroes.reduce((sum, h) => sum + h.bankedXp, 0);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'oklch(0.06 0.01 270)' }}>
      {/* Background prismatic glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        {/* Victory icon */}
        <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.6))' }}>✦</div>

        <div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: 'Cinzel Decorative, serif',
              background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.4))',
            }}
          >
            DELVE COMPLETE
          </h1>
          <p className="text-muted-foreground text-sm">{victoryReason}</p>
        </div>

        {/* Score */}
        <div className="rounded border p-4 space-y-3" style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.2)' }}>
          <div className="text-center">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Delve Score</div>
            <div
              className="text-5xl font-bold font-mono"
              style={{ color: '#22d3ee', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}
            >
              {totalBanked}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total Banked XP</div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center border-t border-white/10 pt-3">
            <div>
              <div className="text-xl font-bold font-mono text-amber-400">{roomNumber}</div>
              <div className="text-xs text-muted-foreground">Rooms</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-blue-400">{depth}</div>
              <div className="text-xs text-muted-foreground">Max Depth</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-green-400">{heroes.filter(h => !h.isDown).length}/{heroes.length}</div>
              <div className="text-xs text-muted-foreground">Survived</div>
            </div>
          </div>

          {/* Hero results */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            {heroes.map((hero, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300">{hero.class}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                    Lv.{hero.level}
                  </span>
                </div>
                <span className="font-mono text-xs text-yellow-400">{hero.bankedXp} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score rating */}
        <div className="text-sm text-muted-foreground">
          {totalBanked >= 500 ? '⭐⭐⭐ Legendary Delver!' :
           totalBanked >= 200 ? '⭐⭐ Seasoned Adventurer' :
           totalBanked >= 50  ? '⭐ Brave Explorer' :
           'Cautious Survivor'}
        </div>

        <button
          onClick={() => dispatch({ type: 'RESET_GAME' })}
          className="px-8 py-3 rounded font-bold text-sm transition-all hover:scale-[1.03]"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))',
            border: '1px solid rgba(6,182,212,0.5)',
            color: '#22d3ee',
            fontFamily: 'Cinzel Decorative, serif',
          }}
        >
          ↺ Begin New Delve
        </button>
      </div>
    </div>
  );
}
