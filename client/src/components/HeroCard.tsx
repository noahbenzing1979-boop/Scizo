// ============================================================
// PRISMATIC DEPTHS — HeroCard Component
// Design: Neon Dungeon Terminal — hero stat panels
// ============================================================

import { HeroStats, HeroClass, getLevel, xpToNextLevel, HERO_TEMPLATES } from '@/lib/gameEngine';
import { DieBadge } from './DiceRoller';
import { cn } from '@/lib/utils';

const HERO_IMAGES: Record<HeroClass, string> = {
  Ironclad: '/manus-storage/hero-ironclad_91972ccb.png',
  Shade:    '/manus-storage/hero-shade_575ccfe9.png',
  Arcanist: '/manus-storage/hero-arcanist_977a24ba.png',
  Warden:   '/manus-storage/hero-warden_7ccbe0c8.png',
};

const HERO_COLORS: Record<HeroClass, { primary: string; glow: string; border: string }> = {
  Ironclad: { primary: '#22d3ee', glow: 'rgba(6,182,212,0.3)', border: 'rgba(6,182,212,0.4)' },
  Shade:    { primary: '#c084fc', glow: 'rgba(168,85,247,0.3)', border: 'rgba(168,85,247,0.4)' },
  Arcanist: { primary: '#4ade80', glow: 'rgba(34,197,94,0.3)', border: 'rgba(34,197,94,0.4)' },
  Warden:   { primary: '#fbbf24', glow: 'rgba(245,158,11,0.3)', border: 'rgba(245,158,11,0.4)' },
};

interface HeroCardProps {
  hero: HeroStats;
  isActive?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

function HPBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 60 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  );
}

function XPBar({ xp, bankedXp, level }: { xp: number; bankedXp: number; level: number }) {
  const nextThreshold = xpToNextLevel(level);
  const pct = level >= 4 ? 100 : Math.min(100, (bankedXp / nextThreshold) * 100);

  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: '#a855f7', boxShadow: '0 0 4px rgba(168,85,247,0.5)' }}
      />
    </div>
  );
}

export default function HeroCard({ hero, isActive, compact, onClick }: HeroCardProps) {
  const colors = HERO_COLORS[hero.class];
  const hpPct = (hero.hp / hero.maxHp) * 100;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative rounded border p-2 transition-all duration-200',
          isActive && 'scale-[1.02]',
          hero.isDown && 'opacity-50',
          onClick && 'cursor-pointer hover:scale-[1.02]',
        )}
        style={{
          background: hero.isDown ? 'rgba(239,68,68,0.05)' : `${colors.glow}`,
          borderColor: hero.isDown ? 'rgba(239,68,68,0.4)' : isActive ? colors.primary : colors.border,
          boxShadow: isActive ? `0 0 16px ${colors.glow}` : 'none',
        }}
      >
        {hero.isDown && (
          <div className="absolute inset-0 flex items-center justify-center rounded z-10 bg-black/60">
            <span className="text-red-400 font-bold text-sm">DOWNED</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <img src={HERO_IMAGES[hero.class]} alt={hero.class} className="w-8 h-8 rounded object-cover object-top" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: colors.primary }}>{hero.class}</span>
              <span className="text-xs font-mono" style={{ color: hpPct > 60 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171' }}>
                {hero.hp}/{hero.maxHp}
              </span>
            </div>
            <HPBar hp={hero.hp} maxHp={hero.maxHp} />
          </div>
        </div>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: colors.primary }} />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded border overflow-hidden transition-all duration-300',
        isActive && 'scale-[1.01]',
        hero.isDown && 'opacity-60',
        onClick && 'cursor-pointer',
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.glow} 0%, rgba(10,10,20,0.9) 60%)`,
        borderColor: hero.isDown ? 'rgba(239,68,68,0.5)' : isActive ? colors.primary : colors.border,
        boxShadow: isActive ? `0 0 20px ${colors.glow}, inset 0 0 20px ${colors.glow}` : 'none',
      }}
    >
      {hero.isDown && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 rounded">
          <div className="text-center">
            <div className="text-red-400 font-bold text-lg">DOWNED</div>
            <div className="text-red-300 text-xs">Needs revival</div>
          </div>
        </div>
      )}

      {/* Hero portrait strip */}
      <div className="relative h-20 overflow-hidden">
        <img
          src={HERO_IMAGES[hero.class]}
          alt={hero.class}
          className="w-full h-full object-cover object-top"
          style={{ filter: 'brightness(0.7) saturate(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-1 left-2 right-2 flex items-end justify-between">
          <div>
            <div className="font-bold text-sm leading-none" style={{ color: colors.primary, fontFamily: 'Cinzel Decorative, serif' }}>
              {hero.class}
            </div>
            <div className="text-xs text-white/50">{hero.role}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold" style={{ color: hpPct > 60 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171' }}>
              {hero.hp}/{hero.maxHp} HP
            </div>
            <div className="text-xs text-white/40">Lv.{hero.level}</div>
          </div>
        </div>
        {isActive && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: colors.primary, color: '#000' }}>
            ACTIVE
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-2 space-y-2">
        {/* HP Bar */}
        <HPBar hp={hero.hp} maxHp={hero.maxHp} />

        {/* XP Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">XP: {hero.bankedXp}</span>
          <span className="font-mono text-purple-400">+{hero.xp} unbanked</span>
        </div>
        <XPBar xp={hero.xp} bankedXp={hero.bankedXp} level={hero.level} />

        {/* Dice pools */}
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div>
            <div className="text-muted-foreground mb-0.5 text-xs">WPN</div>
            <div className="flex flex-wrap gap-0.5">
              {hero.weaponDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5 text-xs">ARM</div>
            <div className="flex flex-wrap gap-0.5">
              {hero.armorDice.length > 0
                ? hero.armorDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)
                : <span className="text-xs text-red-400/60">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5 text-xs">RES</div>
            <div className="flex flex-wrap gap-0.5">
              {hero.reserveDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)}
            </div>
          </div>
        </div>

        {/* Status effects */}
        {hero.statusEffects.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {hero.statusEffects.map((s, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10">
                {s.type} ({s.roundsLeft}r)
              </span>
            ))}
          </div>
        )}

        {/* Blessing tokens */}
        {hero.blessingTokens > 0 && (
          <div className="text-xs text-yellow-400">✦ {hero.blessingTokens} Blessing Token(s)</div>
        )}

        {/* Inventory count */}
        {hero.inventory.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {hero.inventory.filter(i => !i.used).length} item(s) in inventory
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HERO SELECT CARD ─────────────────────────────────────────
interface HeroSelectCardProps {
  heroClass: HeroClass;
  selected: boolean;
  onSelect: () => void;
}

const HERO_DESCRIPTIONS: Record<HeroClass, string> = {
  Ironclad: 'The party\'s anchor. High HP, strong defense. Wins through endurance.',
  Shade:    'Fast and deadly on the opening strike. Fragile but devastating.',
  Arcanist: 'Glass cannon. Catastrophic spell damage but no armor and 6 HP.',
  Warden:   'Utility player. Decent attack, reasonable armor, the only healer.',
};

const HERO_SPECIALS: Record<HeroClass, string> = {
  Ironclad: 'BULWARK: Shield an adjacent ally with your armor dice (once/room)',
  Shade:    'AMBUSH: First attack scores all Aces + Crown bonus',
  Arcanist: 'SPELLCAST: Roll Reserve Dice — Crown Hits deal TRIPLE damage',
  Warden:   'MEND: Heal an adjacent ally using D4+D6 (once/room)',
};

export function HeroSelectCard({ heroClass, selected, onSelect }: HeroSelectCardProps) {
  const colors = HERO_COLORS[heroClass];
  const template = HERO_TEMPLATES[heroClass];

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative rounded border overflow-hidden cursor-pointer transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg',
        selected && 'scale-[1.03] ring-2',
      )}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${colors.glow} 0%, rgba(10,10,20,0.95) 60%)`
          : 'rgba(15,15,25,0.8)',
        borderColor: selected ? colors.primary : 'rgba(255,255,255,0.1)',
        boxShadow: selected ? `0 0 24px ${colors.glow}, 0 0 4px ${colors.primary}` : 'none',
      }}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-xs font-bold" style={{ background: colors.primary, color: '#000' }}>
          SELECTED
        </div>
      )}

      {/* Portrait */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={HERO_IMAGES[heroClass]}
          alt={heroClass}
          className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
          style={{ filter: selected ? 'brightness(0.85) saturate(1.3)' : 'brightness(0.6) saturate(0.9)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <div className="font-bold text-xl" style={{ color: colors.primary, fontFamily: 'Cinzel Decorative, serif', textShadow: `0 0 12px ${colors.primary}` }}>
            {heroClass}
          </div>
          <div className="text-xs text-white/60">{template.role}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-3">
        {/* Core stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">HP</span>
            <span className="font-mono font-bold text-green-400">{template.maxHp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Move</span>
            <span className="font-mono font-bold text-cyan-400">{template.baseMovement}</span>
          </div>
        </div>

        {/* Dice pools */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Weapon</span>
            <div className="flex gap-1">
              {template.weaponDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Armor</span>
            <div className="flex gap-1">
              {template.armorDice.length > 0
                ? template.armorDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)
                : <span className="text-xs text-red-400/60">None</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Reserve</span>
            <div className="flex gap-1">
              {template.reserveDice.map((d, i) => <DieBadge key={i} die={d} size="sm" />)}
            </div>
          </div>
        </div>

        {/* Special ability */}
        <div className="rounded p-2 text-xs" style={{ background: `${colors.glow}`, borderLeft: `2px solid ${colors.primary}` }}>
          <div className="font-bold mb-0.5" style={{ color: colors.primary }}>{HERO_SPECIALS[heroClass].split(':')[0]}</div>
          <div className="text-white/60">{HERO_SPECIALS[heroClass].split(':')[1]?.trim()}</div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">{HERO_DESCRIPTIONS[heroClass]}</p>
      </div>
    </div>
  );
}
