import { Player, getRank, getRankEmoji, getRankLabel } from '@/data/store';
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

const FLAME = [
  { ring: 'flame-ring-1', border: '#ce93d8', glow: 'rgba(156,39,176,0.5)', podiumBg: 'rgba(74,20,140,0.25)', podiumBorder: 'rgba(156,39,176,0.4)', pointColor: '#ce93d8' },
  { ring: 'flame-ring-2', border: '#ffe082', glow: 'rgba(245,166,35,0.5)', podiumBg: 'rgba(230,115,0,0.15)', podiumBorder: 'rgba(245,166,35,0.35)', pointColor: 'var(--gold)' },
  { ring: 'flame-ring-3', border: '#ff5252', glow: 'rgba(229,57,53,0.5)', podiumBg: 'rgba(183,28,28,0.15)', podiumBorder: 'rgba(229,57,53,0.35)', pointColor: '#ff5252' },
];

export default function LeaderboardTab({ players, currentPlayerId, onPlayerClick }: LeaderboardTabProps) {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);

  const podiumOrder = [
    top3[1] ? { player: top3[1], rank: 1, podiumH: '56px', lgPodiumH: '72px', avatarCls: 'w-14 h-14 lg:w-16 lg:h-16', medal: '🥈' } : null,
    top3[0] ? { player: top3[0], rank: 0, podiumH: '72px', lgPodiumH: '96px', avatarCls: 'w-16 h-16 lg:w-20 lg:h-20', medal: '🥇' } : null,
    top3[2] ? { player: top3[2], rank: 2, podiumH: '40px', lgPodiumH: '52px', avatarCls: 'w-12 h-12 lg:w-14 lg:h-14', medal: '🥉' } : null,
  ];

  return (
    <div className="pb-6 lg:pb-8 animate-fade-in">
      {/* Top 3 podium */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 mb-4 lg:mb-8">
        <h2 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground mb-4 lg:mb-6">
          Топ игроки
        </h2>

        <div className="flex gap-3 lg:gap-6 items-end mb-2 max-w-lg lg:max-w-xl mx-auto lg:mx-0">
          {podiumOrder.map((entry, i) => {
            if (!entry) return <div key={i} className="flex-1" />;
            const { player, rank, podiumH, lgPodiumH, avatarCls, medal } = entry;
            const flame = FLAME[rank];
            const isMe = player.id === currentPlayerId;

            return (
              <div
                key={player.id}
                onClick={() => !isMe && onPlayerClick(player.id)}
                className="flex-1 flex flex-col items-center gap-1.5 lg:gap-2 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s`, cursor: isMe ? 'default' : 'pointer' }}
              >
                {rank === 0 && <div className="text-lg lg:text-2xl mb-1">👑</div>}
                <div
                  className={`${avatarCls} rounded-full flex items-center justify-center text-white font-montserrat font-bold border-2 overflow-hidden ${flame.ring}`}
                  style={{ backgroundColor: getAvatarColor(player.id) }}
                >
                  {player.avatar
                    ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    : getInitials(player.name)}
                </div>
                <div className="text-center">
                  <div className="text-xs lg:text-sm font-montserrat font-700 text-foreground leading-tight">
                    {player.name.split(' ')[0]}
                  </div>
                  <div className="text-xs lg:text-sm font-600" style={{ color: flame.pointColor }}>
                    {player.points.toLocaleString()}
                  </div>
                </div>
                <div
                  className="w-full rounded-t-md flex items-center justify-center py-2"
                  style={{ background: flame.podiumBg, border: `1px solid ${flame.podiumBorder}`, height: podiumH }}
                >
                  <span className={rank === 0 ? 'text-xl lg:text-2xl' : 'text-base lg:text-xl'}>{medal}</span>
                </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
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
