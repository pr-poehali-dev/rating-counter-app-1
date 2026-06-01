import type { CSSProperties } from 'react';
import { Player, getRank, getRankEmoji, getRankLabel, Rank } from '@/data/store';
import Icon from '@/components/ui/icon';

interface LeaderboardTabProps {
  players: Player[];
  currentPlayerId: string;
  onPlayerClick: (playerId: string) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
}

const RANK_COLORS: Record<Rank, { primary: string; dark: string; mid: string; glow: string }> = {
  rookie: { primary: '#9ca3af', dark: '#374151', mid: '#6b7280', glow: 'rgba(156,163,175,0.3)' },
  wolf:   { primary: '#7c8fa6', dark: '#1e3a5f', mid: '#4a6fa5', glow: 'rgba(74,111,165,0.35)' },
  shark:  { primary: '#1e88e5', dark: '#0d2d6b', mid: '#1565c0', glow: 'rgba(30,136,229,0.4)' },
  dragon: { primary: '#e53935', dark: '#4a0000', mid: '#b71c1c', glow: 'rgba(229,57,53,0.45)' },
  skull:  { primary: '#f5a623', dark: '#3d2000', mid: '#c97b00', glow: 'rgba(245,166,35,0.5)' },
  queen:  { primary: '#9c27b0', dark: '#1a0030', mid: '#6a0080', glow: 'rgba(156,39,176,0.5)' },
};

function getPodiumStyle(rank: Rank, place: 0 | 1 | 2): CSSProperties {
  const c = RANK_COLORS[rank];
  // Тактический диагональный рисунок — полоски + градиент
  const stripeAngle = place === 0 ? '135deg' : place === 1 ? '120deg' : '150deg';
  return {
    background: `
      repeating-linear-gradient(
        ${stripeAngle},
        transparent 0px,
        transparent 6px,
        ${c.primary}18 6px,
        ${c.primary}18 7px
      ),
      linear-gradient(180deg, ${c.dark} 0%, ${c.mid}44 50%, ${c.dark}cc 100%)
    `,
    border: `1px solid ${c.primary}55`,
    borderBottom: 'none',
    boxShadow: `0 -4px 20px ${c.glow}, inset 0 1px 0 ${c.primary}40`,
  };
}

const FLAME = [
  { ring: 'flame-ring-1', border: '#ce93d8', glow: 'rgba(156,39,176,0.5)', podiumBg: 'rgba(74,20,140,0.25)', podiumBorder: 'rgba(156,39,176,0.4)', pointColor: '#ce93d8' },
  { ring: 'flame-ring-2', border: '#ffe082', glow: 'rgba(245,166,35,0.5)', podiumBg: 'rgba(230,115,0,0.15)', podiumBorder: 'rgba(245,166,35,0.35)', pointColor: 'var(--gold)' },
  { ring: 'flame-ring-3', border: '#ff5252', glow: 'rgba(229,57,53,0.5)', podiumBg: 'rgba(183,28,28,0.15)', podiumBorder: 'rgba(229,57,53,0.35)', pointColor: '#ff5252' },
];

export default function LeaderboardTab({ players, currentPlayerId, onPlayerClick }: LeaderboardTabProps) {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);

  const MEDALS = [
    {
      num: '1',
      mobSize: 'text-5xl', lgSize: 'text-9xl',
      gradient: 'linear-gradient(175deg, #fffbe0 0%, #ffe566 15%, #f5a623 35%, #b8700a 55%, #7a4500 72%, #e8a800 85%, #fff5a0 100%)',
      shadow: '0 0 32px rgba(255,180,0,0.9), 0 0 8px rgba(255,220,80,0.8)',
    },
    {
      num: '2',
      mobSize: 'text-2xl', lgSize: 'text-5xl',
      gradient: 'linear-gradient(160deg, #f5f5f5 0%, #c8c8c8 35%, #8a8a8a 65%, #e0e0e0 100%)',
      shadow: '0 2px 10px rgba(180,180,180,0.5), 0 1px 0 #fff inset',
    },
    {
      num: '3',
      mobSize: 'text-2xl', lgSize: 'text-5xl',
      gradient: 'linear-gradient(160deg, #f0c080 0%, #cd7f32 35%, #7c4a00 65%, #e8a84a 100%)',
      shadow: '0 2px 10px rgba(205,127,50,0.5), 0 1px 0 #f5d9a0 inset',
    },
  ];

  const podiumOrder = [
    top3[1] ? { player: top3[1], rank: 1, podiumH: '56px', lgPodiumH: '80px', avatarMob: 'w-14 h-14', avatarLg: 'w-24 h-24' } : null,
    top3[0] ? { player: top3[0], rank: 0, podiumH: '72px', lgPodiumH: '110px', avatarMob: 'w-16 h-16', avatarLg: 'w-32 h-32' } : null,
    top3[2] ? { player: top3[2], rank: 2, podiumH: '40px', lgPodiumH: '60px', avatarMob: 'w-12 h-12', avatarLg: 'w-20 h-20' } : null,
  ];

  return (
    <div className="pb-6 lg:pb-8 animate-fade-in">
      {/* Top 3 podium */}
      <div className="px-4 pt-4 mb-4 lg:px-8 lg:pt-10 lg:mb-10">
        <h2 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground mb-4 lg:mb-8 lg:text-center">
          Топ игроки
        </h2>

        {/* Mobile: left-aligned; Desktop: centered with max-width */}
        <div className="flex gap-3 items-end mb-2 max-w-lg mx-auto lg:max-w-2xl lg:mx-auto lg:gap-8">
          {podiumOrder.map((entry, i) => {
            if (!entry) return <div key={i} className="flex-1" />;
            const { player, rank, podiumH, lgPodiumH, avatarMob, avatarLg } = entry;
            const flame = FLAME[rank];
            const medal = MEDALS[rank];
            const isMe = player.id === currentPlayerId;
            const playerRank = getRank(player.points);
            const podiumStyle = getPodiumStyle(playerRank, rank as 0 | 1 | 2);

            const MetalNum = ({ cls }: { cls: string }) => (
              <span
                className={`${cls} select-none`}
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  background: medal.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: `drop-shadow(${medal.shadow.split(',')[0]})`,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {medal.num}
              </span>
            );

            return (
              <div
                key={player.id}
                onClick={() => !isMe && onPlayerClick(player.id)}
                className="flex-1 flex flex-col items-center gap-1.5 lg:gap-3 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s`, cursor: isMe ? 'default' : 'pointer' }}
              >
                {rank === 0 && <div className="text-lg lg:text-4xl mb-1">👑</div>}
                {/* Mobile avatar */}
                <div
                  className={`${avatarMob} lg:hidden rounded-full flex items-center justify-center text-white font-montserrat font-bold border-2 overflow-hidden ${flame.ring}`}
                  style={{ backgroundColor: getAvatarColor(player.id) }}
                >
                  {player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : getInitials(player.name)}
                </div>
                {/* Desktop avatar */}
                <div
                  className={`${avatarLg} hidden lg:flex rounded-full items-center justify-center text-white font-montserrat font-bold text-2xl border-2 overflow-hidden ${flame.ring}`}
                  style={{ backgroundColor: getAvatarColor(player.id) }}
                >
                  {player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : getInitials(player.name)}
                </div>
                <div className="text-center">
                  <div className="text-xs lg:text-base font-montserrat font-700 text-foreground leading-tight">
                    {player.name.split(' ')[0]}
                  </div>
                  <div className="text-xs lg:text-sm font-600" style={{ color: flame.pointColor }}>
                    {player.points.toLocaleString()}
                  </div>
                </div>
                <MetalNum cls={`lg:hidden ${medal.mobSize}`} />
                <div className="hidden lg:block"><MetalNum cls={medal.lgSize} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full list */}
      <div className="px-4 lg:px-8">
        <h2 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground mb-3 lg:mb-4">
          Все игроки
        </h2>
        <div className="grid grid-cols-1 gap-2 lg:gap-3">
          {sorted.map((player, idx) => {
            const rank = getRank(player.points);
            const isMe = player.id === currentPlayerId;
            const winRate = player.gamesPlayed > 0
              ? Math.round((player.wins / player.gamesPlayed) * 100)
              : 0;
            const flame = idx < 3 ? FLAME[idx] : null;

            return (
              <div
                key={player.id}
                onClick={() => !isMe && onPlayerClick(player.id)}
                className="flex items-center gap-3 p-3 lg:p-4 rounded-lg hover-scale"
                style={{
                  background: flame
                    ? `linear-gradient(90deg, ${flame.glow.replace('0.5', '0.08')}, rgba(10,10,14,0.7))`
                    : isMe
                      ? 'linear-gradient(90deg, rgba(245,166,35,0.08), rgba(10,10,14,0.7))'
                      : 'rgba(10,10,14,0.55)',
                  border: flame
                    ? `1px solid ${flame.podiumBorder}`
                    : isMe
                      ? '1px solid rgba(245,166,35,0.3)'
                      : '1px solid hsl(var(--border))',
                  backdropFilter: 'blur(6px)',
                  cursor: isMe ? 'default' : 'pointer',
                }}
              >
                <div className="w-7 text-center font-montserrat font-700 text-sm"
                  style={{ color: flame ? flame.pointColor : 'hsl(var(--muted-foreground))' }}>
                  {idx + 1}
                </div>

                <div
                  className={`w-9 h-9 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xs flex-shrink-0 overflow-hidden${flame ? ` ${flame.ring}` : ''}`}
                  style={{ backgroundColor: getAvatarColor(player.id) }}
                >
                  {player.avatar
                    ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    : getInitials(player.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-montserrat font-600 text-sm lg:text-base text-foreground truncate">{player.name}</span>
                    {isMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded-sm font-600"
                        style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', fontSize: '10px' }}>ВЫ</span>
                    )}
                    {player.isAdmin && (
                      <span className="text-xs px-1.5 py-0.5 rounded-sm font-600"
                        style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', fontSize: '10px' }}>ADMIN</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{getRankEmoji(rank)}</span>
                    <span>{getRankLabel(rank)}</span>
                    <span className="mx-1">·</span>
                    <span className="text-green-400">{winRate}% побед</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-montserrat font-700 text-sm lg:text-base"
                    style={{ color: flame ? flame.pointColor : 'hsl(var(--foreground))' }}>
                    {player.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{player.gamesPlayed} игр</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}