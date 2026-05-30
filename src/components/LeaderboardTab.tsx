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
  const idx = parseInt(id) % colors.length;
  return colors[idx];
}

export default function LeaderboardTab({ players, currentPlayerId, onPlayerClick }: LeaderboardTabProps) {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);
  const medalColors = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];

  return (
    <div className="pb-6 animate-fade-in">
      {/* Top 3 podium */}
      <div className="px-4 pt-4 mb-4">
        <h2 className="font-montserrat text-xs font-700 uppercase tracking-widest text-muted-foreground mb-4">
          Топ игроки
        </h2>

        <div className="flex gap-3 items-end mb-2">
          {/* 2nd */}
          {top3[1] && (
            <div onClick={() => top3[1].id !== currentPlayerId && onPlayerClick(top3[1].id)} className="flex-1 flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '0.1s', cursor: top3[1].id !== currentPlayerId ? 'pointer' : 'default' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-sm border-2"
                style={{ backgroundColor: getAvatarColor(top3[1].id), borderColor: 'var(--silver)' }}
              >
                {top3[1].avatar ? (
                  <img src={top3[1].avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : getInitials(top3[1].name)}
              </div>
              <div className="text-center">
                <div className="text-xs font-montserrat font-600 text-foreground leading-tight">
                  {top3[1].name.split(' ')[0]}
                </div>
                <div className="text-xs" style={{ color: 'var(--silver)' }}>
                  {top3[1].points.toLocaleString()}
                </div>
              </div>
              <div
                className="w-full rounded-t-md flex items-center justify-center py-2"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', height: '48px' }}
              >
                <span className="text-lg">🥈</span>
              </div>
            </div>
          )}

          {/* 1st */}
          {top3[0] && (
            <div onClick={() => top3[0].id !== currentPlayerId && onPlayerClick(top3[0].id)} className="flex-1 flex flex-col items-center gap-2 animate-slide-up" style={{ cursor: top3[0].id !== currentPlayerId ? 'pointer' : 'default' }}>
              <div className="text-base">👑</div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-base border-2"
                style={{ backgroundColor: getAvatarColor(top3[0].id), borderColor: 'var(--gold)', boxShadow: '0 0 16px rgba(245,166,35,0.4)' }}
              >
                {top3[0].avatar ? (
                  <img src={top3[0].avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : getInitials(top3[0].name)}
              </div>
              <div className="text-center">
                <div className="text-sm font-montserrat font-700 text-foreground leading-tight">
                  {top3[0].name.split(' ')[0]}
                </div>
                <div className="text-xs font-600" style={{ color: 'var(--gold)' }}>
                  {top3[0].points.toLocaleString()}
                </div>
              </div>
              <div
                className="w-full rounded-t-md flex items-center justify-center py-2"
                style={{ backgroundColor: 'hsl(220 14% 14%)', border: '1px solid rgba(245,166,35,0.3)', height: '64px' }}
              >
                <span className="text-xl">🥇</span>
              </div>
            </div>
          )}

          {/* 3rd */}
          {top3[2] && (
            <div onClick={() => top3[2].id !== currentPlayerId && onPlayerClick(top3[2].id)} className="flex-1 flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '0.2s', cursor: top3[2].id !== currentPlayerId ? 'pointer' : 'default' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-sm border-2"
                style={{ backgroundColor: getAvatarColor(top3[2].id), borderColor: 'var(--bronze)' }}
              >
                {top3[2].avatar ? (
                  <img src={top3[2].avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : getInitials(top3[2].name)}
              </div>
              <div className="text-center">
                <div className="text-xs font-montserrat font-600 text-foreground leading-tight">
                  {top3[2].name.split(' ')[0]}
                </div>
                <div className="text-xs" style={{ color: 'var(--bronze)' }}>
                  {top3[2].points.toLocaleString()}
                </div>
              </div>
              <div
                className="w-full rounded-t-md flex items-center justify-center py-2"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', height: '36px' }}
              >
                <span className="text-base">🥉</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full list */}
      <div className="px-4">
        <h2 className="font-montserrat text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3">
          Все игроки
        </h2>
        <div className="flex flex-col gap-2">
          {sorted.map((player, idx) => {
            const rank = getRank(player.points);
            const isMe = player.id === currentPlayerId;
            const winRate = player.gamesPlayed > 0
              ? Math.round((player.wins / player.gamesPlayed) * 100)
              : 0;

            return (
              <div
                key={player.id}
                onClick={() => !isMe && onPlayerClick(player.id)}
                className="flex items-center gap-3 p-3 rounded-lg hover-scale"
                style={{
                  background: isMe
                    ? 'linear-gradient(90deg, hsl(38 92% 54% / 0.08), hsl(var(--card)))'
                    : 'hsl(var(--card))',
                  border: isMe
                    ? '1px solid rgba(245,166,35,0.3)'
                    : '1px solid hsl(var(--border))',
                  cursor: isMe ? 'default' : 'pointer',
                }}
              >
                {/* Position */}
                <div
                  className="w-6 text-center font-montserrat font-700 text-sm"
                  style={{
                    color: idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--silver)' : idx === 2 ? 'var(--bronze)' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {idx + 1}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(player.id) }}
                >
                  {player.avatar ? (
                    <img src={player.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : getInitials(player.name)}
                </div>

                {/* Name & rank */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-montserrat font-600 text-sm text-foreground truncate">
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded-sm font-600"
                        style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', fontSize: '10px' }}>
                        ВЫ
                      </span>
                    )}
                    {player.isAdmin && (
                      <span className="text-xs px-1.5 py-0.5 rounded-sm font-600"
                        style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', fontSize: '10px' }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{getRankEmoji(rank)}</span>
                    <span>{getRankLabel(rank)}</span>
                    <span className="mx-1">·</span>
                    <span className="text-green-400">{winRate}% побед</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-montserrat font-700 text-sm"
                    style={{ color: idx < 3 ? medalColors[idx] : 'hsl(var(--foreground))' }}
                  >
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