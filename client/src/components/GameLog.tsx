// ============================================================
// PRISMATIC DEPTHS — GameLog Component
// Design: Neon Dungeon Terminal — scrolling action log
// ============================================================

import { useEffect, useRef } from 'react';
import { LogEntry } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';

const LOG_COLORS: Record<LogEntry['type'], string> = {
  action:  'text-cyan-300',
  damage:  'text-red-400',
  heal:    'text-green-400',
  prism:   'text-purple-400',
  loot:    'text-yellow-300',
  system:  'text-slate-400',
  combo:   'text-amber-300',
  death:   'text-red-500',
  crown:   'text-yellow-400',
};

const LOG_BG: Record<LogEntry['type'], string> = {
  action:  '',
  damage:  'bg-red-950/20',
  heal:    'bg-green-950/20',
  prism:   'bg-purple-950/30',
  loot:    'bg-yellow-950/20',
  system:  '',
  combo:   'bg-amber-950/20',
  death:   'bg-red-950/40',
  crown:   'bg-yellow-950/20',
};

interface GameLogProps {
  entries: LogEntry[];
  maxHeight?: string;
  className?: string;
}

export default function GameLog({ entries, maxHeight = '280px', className }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  // Show last 50 entries
  const visible = entries.slice(-50);

  return (
    <div
      className={cn('relative overflow-hidden rounded border', className)}
      style={{ background: 'rgba(5,5,12,0.9)', borderColor: 'rgba(6,182,212,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'rgba(6,182,212,0.05)' }}>
        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Combat Log</span>
        <span className="text-xs font-mono text-muted-foreground">{entries.length} entries</span>
      </div>

      {/* Log entries */}
      <div
        className="overflow-y-auto p-2 space-y-0.5"
        style={{ maxHeight }}
      >
        {visible.map((entry, i) => (
          <div
            key={entry.id}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-mono leading-relaxed transition-all',
              LOG_BG[entry.type],
              i === visible.length - 1 && 'ring-1 ring-white/10',
            )}
          >
            <span className={LOG_COLORS[entry.type]}>{entry.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />
    </div>
  );
}
