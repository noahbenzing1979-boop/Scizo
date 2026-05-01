// ============================================================
// PRISMATIC DEPTHS — LootPanel Component
// Design: Neon Dungeon Terminal — loot draw interface
// ============================================================

import { useState } from 'react';
import { LootItem, HeroStats } from '@/lib/gameEngine';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';

const SUIT_ICONS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '🃏',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: '#f87171',
  diamonds: '#60a5fa',
  clubs: '#4ade80',
  spades: '#c084fc',
  joker: '#fbbf24',
};

interface LootItemCardProps {
  item: LootItem;
  onUse?: () => void;
  compact?: boolean;
}

export function LootItemCard({ item, onUse, compact }: LootItemCardProps) {
  const color = SUIT_COLORS[item.suit];
  const icon = SUIT_ICONS[item.suit];

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded border p-1.5 text-xs',
          item.used && 'opacity-40',
        )}
        style={{ background: `${color}10`, borderColor: `${color}30` }}
      >
        <span style={{ color }} className="text-base font-bold">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ color }}>{item.name}</div>
          <div className="text-muted-foreground text-xs truncate">{item.effect}</div>
        </div>
        {onUse && !item.used && (
          <button
            onClick={onUse}
            className="px-2 py-0.5 rounded text-xs font-bold shrink-0 transition-all hover:scale-105"
            style={{ background: color, color: '#000' }}
          >
            USE
          </button>
        )}
        {item.used && <span className="text-xs text-muted-foreground shrink-0">used</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded border p-3 transition-all duration-200',
        item.used && 'opacity-40',
      )}
      style={{ background: `${color}08`, borderColor: `${color}30` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm" style={{ color }}>{item.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.effect}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
              {item.cardValue} of {item.suit}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
          </div>
        </div>
      </div>
      {onUse && !item.used && (
        <button
          onClick={onUse}
          className="mt-2 w-full py-1.5 rounded text-xs font-bold transition-all hover:scale-[1.02]"
          style={{ background: `${color}20`, border: `1px solid ${color}50`, color }}
        >
          USE ITEM
        </button>
      )}
    </div>
  );
}

// ─── LOOT DRAW PANEL ──────────────────────────────────────────
interface LootDrawPanelProps {
  pendingDraws: number;
  heroes: HeroStats[];
  activeHeroIndex: number;
}

export function LootDrawPanel({ pendingDraws, heroes, activeHeroIndex }: LootDrawPanelProps) {
  const { dispatch } = useGame();
  const [selectedHero, setSelectedHero] = useState(activeHeroIndex);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDraw = () => {
    setIsDrawing(true);
    setTimeout(() => {
      dispatch({ type: 'DRAW_LOOT', heroIndex: selectedHero });
      setIsDrawing(false);
    }, 600);
  };

  return (
    <div className="rounded border p-4 space-y-4" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.3)' }}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">✦</span>
        <div>
          <div className="font-bold text-amber-300" style={{ fontFamily: 'Cinzel Decorative, serif' }}>Loot Draw!</div>
          <div className="text-xs text-muted-foreground">{pendingDraws} draw(s) remaining</div>
        </div>
      </div>

      {/* Hero selector */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Draw for:</div>
        <div className="flex gap-2 flex-wrap">
          {heroes.map((h, i) => (
            <button
              key={i}
              onClick={() => setSelectedHero(i)}
              className={cn(
                'px-3 py-1.5 rounded border text-xs font-bold transition-all',
                selectedHero === i ? 'scale-105' : 'opacity-60',
              )}
              style={{
                background: selectedHero === i ? 'rgba(245,158,11,0.2)' : 'transparent',
                borderColor: selectedHero === i ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                color: selectedHero === i ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              }}
            >
              {h.class}
            </button>
          ))}
        </div>
      </div>

      {/* Draw button */}
      <button
        onClick={handleDraw}
        disabled={isDrawing}
        className={cn(
          'w-full py-3 rounded font-bold text-sm transition-all duration-300',
          isDrawing ? 'opacity-60' : 'hover:scale-[1.02]',
        )}
        style={{
          background: isDrawing ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.2)',
          border: '1px solid rgba(245,158,11,0.5)',
          color: '#fbbf24',
          boxShadow: isDrawing ? 'none' : '0 0 16px rgba(245,158,11,0.2)',
        }}
      >
        {isDrawing ? '🃏 Drawing...' : '🃏 Draw Loot Card'}
      </button>
    </div>
  );
}

// ─── INVENTORY PANEL ──────────────────────────────────────────
interface InventoryPanelProps {
  hero: HeroStats;
  heroIndex: number;
  inCombat?: boolean;
}

export function InventoryPanel({ hero, heroIndex, inCombat }: InventoryPanelProps) {
  const { dispatch } = useGame();
  const activeItems = hero.inventory.filter(i => !i.used);
  const usedItems = hero.inventory.filter(i => i.used);

  if (hero.inventory.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-muted-foreground">
        No items in inventory
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activeItems.map(item => (
        <LootItemCard
          key={item.id}
          item={item}
          compact
          onUse={inCombat || item.type !== 'consumable' ? undefined : () => dispatch({ type: 'USE_ITEM', heroIndex, itemId: item.id })}
        />
      ))}
      {usedItems.length > 0 && (
        <div className="text-xs text-muted-foreground mt-2">
          {usedItems.length} used item(s)
        </div>
      )}
    </div>
  );
}
