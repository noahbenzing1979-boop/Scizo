// ============================================================
// PRISMATIC DEPTHS — DiceRoller Component
// Design: Neon Dungeon Terminal — each die glows in its own color
// ============================================================

import { useState, useEffect } from 'react';
import { DieType, DieRoll, DIE_CONFIG } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';

interface DiceRollerProps {
  rolls: DieRoll[];
  isRolling?: boolean;
  showCombo?: boolean;
  className?: string;
}

const DIE_SHAPES: Record<DieType, string> = {
  D4:  'polygon(50% 0%, 0% 100%, 100% 100%)',
  D6:  'none', // square
  D8:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  D10: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  D12: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  D20: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
};

const DIE_COLORS: Record<DieType, { bg: string; border: string; glow: string; text: string }> = {
  D4:  { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', glow: '0 0 12px rgba(168,85,247,0.6)', text: '#c084fc' },
  D6:  { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', glow: '0 0 12px rgba(59,130,246,0.6)', text: '#60a5fa' },
  D8:  { bg: 'rgba(6,182,212,0.15)',  border: '#06b6d4', glow: '0 0 12px rgba(6,182,212,0.6)',  text: '#22d3ee' },
  D10: { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', glow: '0 0 12px rgba(34,197,94,0.6)',  text: '#4ade80' },
  D12: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', glow: '0 0 12px rgba(245,158,11,0.6)', text: '#fbbf24' },
  D20: { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', glow: '0 0 12px rgba(239,68,68,0.6)',  text: '#f87171' },
};

function Die({ roll, isRolling, index }: { roll: DieRoll; isRolling: boolean; index: number }) {
  const colors = DIE_COLORS[roll.type];
  const isScoring = roll.result !== 'miss';
  const isCrown = roll.result === 'crown';
  const isAce = roll.result === 'ace';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1',
        isRolling && 'die-rolling',
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Die body */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-sm transition-all duration-300',
          'w-12 h-12 sm:w-14 sm:h-14',
          isCrown && 'scale-110',
          roll.setAside && 'opacity-40',
        )}
        style={{
          background: isScoring ? colors.bg : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isScoring ? colors.border : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isScoring ? colors.glow : 'none',
        }}
      >
        {/* Crown indicator */}
        {isCrown && (
          <div className="absolute -top-1 -right-1 text-xs" style={{ color: colors.text }}>♛</div>
        )}
        {/* Ace indicator */}
        {isAce && (
          <div className="absolute -top-1 -right-1 text-xs text-white opacity-70">✦</div>
        )}

        {/* Die value */}
        <span
          className="font-mono font-bold text-lg leading-none"
          style={{ color: isScoring ? colors.text : 'rgba(255,255,255,0.3)' }}
        >
          {roll.value}
        </span>
      </div>

      {/* Die type label */}
      <span
        className="text-xs font-mono font-medium"
        style={{ color: colors.text, opacity: 0.7 }}
      >
        {roll.type}
      </span>

      {/* Hits badge */}
      {isScoring && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold px-1 rounded"
          style={{ background: colors.border, color: '#000', fontSize: '0.65rem' }}
        >
          +{roll.hits}
        </span>
      )}
    </div>
  );
}

export default function DiceRoller({ rolls, isRolling = false, showCombo = true, className }: DiceRollerProps) {
  const totalHits = rolls.reduce((sum, r) => sum + r.hits, 0);
  const scoringCount = rolls.filter(r => r.result !== 'miss').length;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Dice grid */}
      <div className="flex flex-wrap gap-3 justify-center">
        {rolls.map((roll, i) => (
          <Die key={`${roll.type}-${i}`} roll={roll} isRolling={isRolling} index={i} />
        ))}
      </div>

      {/* Summary */}
      {rolls.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-muted-foreground font-mono">
            {scoringCount}/{rolls.length} scoring
          </span>
          <span className="font-bold font-mono text-base" style={{ color: totalHits > 0 ? '#22d3ee' : 'rgba(255,255,255,0.3)' }}>
            {totalHits} HITS
          </span>
        </div>
      )}
    </div>
  );
}

// ─── DIE SELECTOR ─────────────────────────────────────────────
interface DieSelectorProps {
  availableDice: DieType[];
  selectedDice: DieType[];
  onToggle: (die: DieType) => void;
  label?: string;
  maxSelect?: number;
}

export function DieSelector({ availableDice, selectedDice, onToggle, label, maxSelect }: DieSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {availableDice.map(die => {
          const colors = DIE_COLORS[die];
          const isSelected = selectedDice.includes(die);
          const canSelect = !maxSelect || selectedDice.length < maxSelect || isSelected;

          return (
            <button
              key={die}
              onClick={() => canSelect && onToggle(die)}
              disabled={!canSelect && !isSelected}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-mono font-bold transition-all duration-200',
                'border',
                isSelected ? 'scale-105' : 'opacity-60 hover:opacity-90',
                !canSelect && !isSelected && 'opacity-20 cursor-not-allowed',
              )}
              style={{
                background: isSelected ? colors.bg : 'transparent',
                borderColor: isSelected ? colors.border : 'rgba(255,255,255,0.15)',
                color: isSelected ? colors.text : 'rgba(255,255,255,0.5)',
                boxShadow: isSelected ? colors.glow : 'none',
              }}
            >
              {die}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SINGLE DIE BUTTON ────────────────────────────────────────
interface DieBadgeProps {
  die: DieType;
  size?: 'sm' | 'md';
  onClick?: () => void;
  selected?: boolean;
}

export function DieBadge({ die, size = 'md', onClick, selected }: DieBadgeProps) {
  const colors = DIE_COLORS[die];
  return (
    <button
      onClick={onClick}
      className={cn(
        'font-mono font-bold rounded border transition-all duration-200',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm',
        selected && 'scale-105',
        onClick && 'hover:scale-105',
      )}
      style={{
        background: selected ? colors.bg : 'rgba(255,255,255,0.04)',
        borderColor: selected ? colors.border : 'rgba(255,255,255,0.12)',
        color: selected ? colors.text : 'rgba(255,255,255,0.4)',
        boxShadow: selected ? colors.glow : 'none',
      }}
    >
      {die}
    </button>
  );
}
