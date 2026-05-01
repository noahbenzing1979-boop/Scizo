// ============================================================
// PRISMATIC DEPTHS — DiceRollAnimation Component
// Design: Neon Dungeon Terminal — animated dice roll visualization
// ============================================================

import React, { useEffect, useState } from 'react';
import { DieType, DieRoll, DIE_CONFIG } from '@/lib/gameEngine';

interface DiceRollAnimationProps {
  rolls: DieRoll[];
  isRolling?: boolean;
  onComplete?: () => void;
}

const AnimatedDie: React.FC<{
  die: DieType;
  value: number;
  result: 'ace' | 'crown' | 'miss';
  isRolling: boolean;
  delay: number;
}> = ({ die, value, result, isRolling, delay }) => {
  const config = DIE_CONFIG[die];
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now();
    const duration = 600 + delay * 100;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Spin through random values while rolling
        const randomValue = Math.floor(Math.random() * config.sides) + 1;
        setDisplayValue(randomValue);
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isRolling, value, die, config.sides, delay]);

  const resultColor =
    result === 'ace' ? '#4ade80' : result === 'crown' ? '#fbbf24' : '#6b7280';
  const resultGlow =
    result === 'ace'
      ? 'rgba(74,222,128,0.4)'
      : result === 'crown'
        ? 'rgba(251,191,36,0.4)'
        : 'none';

  return (
    <div
      className={`relative w-12 h-12 flex items-center justify-center rounded border-2 transition-all duration-300 ${isRolling ? 'die-rolling' : ''}`}
      style={{
        borderColor: config.color,
        background: `${config.color}15`,
        boxShadow: `0 0 12px ${config.color}40, inset 0 0 8px ${config.color}20`,
        animationDelay: `${delay * 50}ms`,
      }}
    >
      {/* Glow effect for ace/crown */}
      {!isRolling && (result === 'ace' || result === 'crown') && (
        <div
          className="absolute inset-0 rounded animate-pulse"
          style={{
            background: resultGlow,
            boxShadow: `0 0 16px ${resultColor}`,
          }}
        />
      )}

      {/* Die label and value */}
      <div className="relative z-10 text-center">
        <div className="text-xs font-bold" style={{ color: config.color }}>
          {die}
        </div>
        <div
          className="text-lg font-bold font-mono"
          style={{
            color: resultColor,
            textShadow: `0 0 4px ${resultColor}`,
          }}
        >
          {displayValue}
        </div>
      </div>

      {/* Result badge */}
      {!isRolling && result !== 'miss' && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: resultColor,
            color: '#000',
            boxShadow: `0 0 8px ${resultColor}`,
          }}
        >
          {result === 'ace' ? '✓' : '★'}
        </div>
      )}
    </div>
  );
};

export default function DiceRollAnimation({
  rolls,
  isRolling = false,
  onComplete,
}: DiceRollAnimationProps) {
  useEffect(() => {
    if (!isRolling && onComplete) {
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [isRolling, onComplete]);

  const totalHits = rolls.reduce((sum, r) => sum + r.hits, 0);
  const scoringCount = rolls.filter((r) => r.result !== 'miss').length;

  return (
    <div className="space-y-4">
      {/* Dice grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {rolls.map((roll, i) => (
          <AnimatedDie
            key={i}
            die={roll.type}
            value={roll.value}
            result={roll.result}
            isRolling={isRolling}
            delay={i}
          />
        ))}
      </div>

      {/* Results summary */}
      {!isRolling && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scoring Dice:</span>
            <span className="font-bold text-cyan-400">{scoringCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Hits:</span>
            <span className="font-bold text-yellow-400">{totalHits}</span>
          </div>

          {/* Hit breakdown */}
          {rolls.filter((r) => r.result !== 'miss').length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1 mt-3 pt-3 border-t border-border">
              {rolls
                .filter((r) => r.result !== 'miss')
                .map((roll, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {roll.type} rolled {roll.value}:
                    </span>
                    <span
                      style={{
                        color:
                          roll.result === 'ace'
                            ? '#4ade80'
                            : roll.result === 'crown'
                              ? '#fbbf24'
                              : '#6b7280',
                      }}
                    >
                      {roll.result === 'ace' ? 'ACE' : 'CROWN'} ({roll.hits}
                      {roll.hits > 1 ? ' hits' : ' hit'})
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
