// ============================================================
// PRISMATIC DEPTHS — MonsterCard Component
// Design: Neon Dungeon Terminal — monster stat blocks with images
// ============================================================

import { Monster } from '@/lib/gameEngine';
import { DieBadge } from './DiceRoller';
import { cn } from '@/lib/utils';

const TIER_COLORS = {
  1: { primary: '#fbbf24', glow: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.3)' },
  2: { primary: '#f87171', glow: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)' },
  3: { primary: '#c084fc', glow: 'rgba(168,85,247,0.25)', border: 'rgba(168,85,247,0.4)' },
};

const MONSTER_ICONS: Record<string, string> = {
  'Giant Rat': '🐀',
  'Goblin': '👺',
  'Skeleton Warrior': '💀',
  'Giant Spider': '🕷',
  'Cultist': '🔮',
  'Orc Warrior': '⚔',
  'Cave Troll': '🪨',
  'Wraith': '👻',
  'Mimic': '📦',
  'Dark Priest': '🧿',
  'Dark Knight': '🏴',
  'Dragon Wyrmling': '🐉',
  'Lich King': '💀',
};

const MONSTER_IMAGES: Record<string, string> = {
  'Cultist': '/manus-storage/monster-cultist_aabc3733.png',
  'Giant Spider': '/manus-storage/monster-spider_5f546013.png',
  'Wraith': '/manus-storage/monster-wraith_dfc15a79.png',
  'Dragon Wyrmling': '/manus-storage/monster-dragon_15a83706.png',
  'Lich King': '/manus-storage/monster-lich_32b3bdb2.png',
};

interface MonsterCardProps {
  monster: Monster;
  isActive?: boolean;
  compact?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

function HPBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  );
}

export default function MonsterCard({ monster, isActive, compact, onClick, selected }: MonsterCardProps) {
  const colors = TIER_COLORS[monster.tier];
  const hpPct = (monster.hp / monster.maxHp) * 100;
  const hpColor = hpPct > 60 ? '#f87171' : hpPct > 25 ? '#fbbf24' : '#4ade80';
  const icon = MONSTER_ICONS[monster.name] || '👾';
  const monsterImage = MONSTER_IMAGES[monster.name];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative rounded border p-2 transition-all duration-200',
          selected && 'scale-[1.02]',
          monster.hp <= 0 && 'opacity-30',
          onClick && monster.hp > 0 && 'cursor-pointer hover:scale-[1.02]',
        )}
        style={{
          background: selected ? colors.glow : 'rgba(255,255,255,0.03)',
          borderColor: selected ? colors.primary : monster.hp <= 0 ? 'rgba(255,255,255,0.05)' : colors.border,
          boxShadow: selected ? `0 0 12px ${colors.glow}` : 'none',
        }}
      >
        {monster.hp <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-xs text-green-400 font-bold">DEFEATED</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold truncate" style={{ color: colors.primary }}>{monster.name}</span>
              <span className="text-xs font-mono ml-1" style={{ color: hpColor }}>{monster.hp}/{monster.maxHp}</span>
            </div>
            <HPBar hp={monster.hp} maxHp={monster.maxHp} color={hpColor} />
          </div>
        </div>
        {selected && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: colors.primary }} />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded border p-3 transition-all duration-300 overflow-hidden',
        selected && 'scale-[1.02]',
        monster.hp <= 0 && 'opacity-30',
        onClick && monster.hp > 0 && 'cursor-pointer hover:scale-[1.02]',
      )}
      style={{
        background: selected ? colors.glow : 'rgba(255,255,255,0.02)',
        borderColor: selected ? colors.primary : colors.border,
        boxShadow: selected ? `0 0 16px ${colors.glow}` : 'none',
      }}
    >
      {/* Monster image background */}
      {monsterImage && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img src={monsterImage} alt={monster.name} className="w-full h-full object-cover" />
        </div>
      )}

      {monster.hp <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded">
          <span className="text-green-400 font-bold">DEFEATED</span>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color: colors.primary }}>{monster.name}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded border text-xs" style={{ borderColor: colors.border, color: colors.primary, background: colors.glow }}>
              Tier {monster.tier}
            </span>
            <span className="text-xs text-muted-foreground">DEF: {monster.defense}</span>
            <span className="text-xs text-yellow-400">{monster.xp} XP</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-sm" style={{ color: hpColor }}>{monster.hp}/{monster.maxHp}</div>
          <div className="text-xs text-muted-foreground">HP</div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="relative z-10">
        <HPBar hp={monster.hp} maxHp={monster.maxHp} color={hpColor} />
      </div>

      {/* Attack dice */}
      <div className="relative z-10 flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">ATK:</span>
        <div className="flex gap-1">
          {monster.attackDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)}
        </div>
      </div>

      {/* Special ability */}
      <div className="relative z-10 mt-2 text-xs rounded p-1.5" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${colors.primary}40` }}>
        <span className="text-muted-foreground">{monster.special}</span>
      </div>
    </div>
  );
}
