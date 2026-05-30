import { useState, useRef } from 'react';
import { Player, Game, getRank, getNextRankThreshold } from '@/data/store';
import Icon from '@/components/ui/icon';

interface ProfileTabProps {
  player: Player;
  onUpdatePlayer: (updates: Partial<Player>) => void;
  allPlayers: Player[];
  games: Game[];
  onLogout: () => void;
}

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const RANKS = [
  { key: 'rookie', label: 'Новобранец', emoji: '🎯', threshold: 0, next: 5000, color: '#9CA3AF' },
  { key: 'wolf', label: 'Волк', emoji: '🐺', threshold: 5000, next: 10000, color: '#6B7280' },
  { key: 'shark', label: 'Акула', emoji: '🦈', threshold: 10000, next: 15000, color: '#1E88E5' },
  { key: 'dragon', label: 'Дракон', emoji: '🐉', threshold: 15000, next: 20000, color: '#E53935' },
  { key: 'skull', label: 'Владыка', emoji: '💀👑🔥', threshold: 20000, next: 25000, color: '#F5A623' },
  { key: 'queen', label: 'Королева тьмы', emoji: '👸🔥', threshold: 25000, next: 25000, color: '#9C27B0' },
];

export default function ProfileTab({ player, onUpdatePlayer, allPlayers, games, onLogout }: ProfileTabProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rank = getRank(player.points);
  const rankInfo = RANKS.find(r => r.key === rank)!;
  const nextThreshold = getNextRankThreshold(player.points);
  const prevThreshold = rankInfo.threshold;
  const progress = rank === 'queen' ? 100
    : Math.round(((player.points - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
  const nextRank = RANKS[RANKS.findIndex(r => r.key === rank) + 1];

  const winRate = player.gamesPlayed > 0
    ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;

  const myRankIndex = allPlayers.sort((a, b) => b.points - a.points).findIndex(p => p.id === player.id) + 1;

  // Собираем все выполненные доп. задания игрока
  const completedTasks = games.flatMap(game =>
    game.bonusTasks
      .filter(task => task.completedBy.includes(player.id))
      .map(task => ({ taskName: task.name, taskPoints: task.points, gameName: game.title }))
  );

  function handleSave() {
    if (editName.trim()) {
      onUpdatePlayer({ name: editName.trim() });
    }
    setEditing(false);
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdatePlayer({ avatar: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="pb-6 animate-fade-in">
      {/* Profile hero */}
      <div className="relative px-4 pt-4 pb-6" style={{ background: 'linear-gradient(180deg, hsl(220 14% 13%) 0%, hsl(var(--background)) 100%)' }}>
        {/* Rank badge background glow */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: rankInfo.color }}
        />

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xl overflow-hidden border-2"
              style={{ backgroundColor: getAvatarColor(player.id), borderColor: rankInfo.color, boxShadow: `0 0 20px ${rankInfo.color}50` }}
            >
              {player.avatar ? (
                <img src={player.avatar} className="w-full h-full object-cover" alt="" />
              ) : getInitials(player.name)}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              <Icon name="Camera" size={12} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Name & rank */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 text-base font-montserrat font-700 px-2 py-1 rounded outline-none"
                  style={{ background: 'hsl(var(--muted))', border: `1px solid ${rankInfo.color}60`, color: 'hsl(var(--foreground))' }}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
                <button onClick={handleSave} className="text-green-400">
                  <Icon name="Check" size={18} />
                </button>
                <button onClick={() => { setEditName(player.name); setEditing(false); }} className="text-muted-foreground">
                  <Icon name="X" size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-montserrat font-800 text-lg text-foreground truncate">{player.name}</span>
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <Icon name="Pen" size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{rankInfo.emoji}</span>
              <span className="font-montserrat font-600 text-sm" style={{ color: rankInfo.color }}>
                {rankInfo.label}
              </span>
              {player.isAdmin && (
                <span className="text-xs px-1.5 py-0.5 rounded font-600"
                  style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', fontSize: '10px' }}>
                  ADMIN
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Icon name="Trophy" size={11} />
              <span>#{myRankIndex} в рейтинге</span>
            </div>
          </div>
        </div>

        {/* Points & progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="font-montserrat font-900 text-3xl" style={{ color: rankInfo.color }}>
              {player.points.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {rank !== 'queen' && (
                <>
                  <div>До {nextRank?.label}</div>
                  <div className="font-600 text-foreground">{(nextThreshold - player.points).toLocaleString()} очков</div>
                </>
              )}
              {rank === 'queen' && <div className="text-purple-400 font-600">Максимальный ранг</div>}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${rankInfo.color}80, ${rankInfo.color})`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{prevThreshold.toLocaleString()}</span>
            <span>{nextThreshold.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 space-y-4">
        <h3 className="font-montserrat text-xs font-700 uppercase tracking-widest text-muted-foreground">
          Статистика
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Игр', value: player.gamesPlayed, icon: 'Gamepad2', color: 'hsl(var(--foreground))' },
            { label: 'Побед', value: player.wins, icon: 'Trophy', color: '#4CAF50' },
            { label: 'Поражений', value: player.losses, icon: 'X', color: '#E53935' },
          ].map(stat => (
            <div key={stat.label} className="card-surface p-3 text-center rounded-lg">
              <div className="font-montserrat font-800 text-xl" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Win rate */}
        <div className="card-surface rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-montserrat font-600 text-muted-foreground">Процент побед</span>
            <span className="font-montserrat font-700 text-sm" style={{ color: winRate >= 50 ? '#4CAF50' : '#E53935' }}>
              {winRate}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${winRate}%`, background: winRate >= 50 ? '#4CAF50' : '#E53935' }}
            />
          </div>
        </div>

        {/* Rank progression */}
        <div>
          <h3 className="font-montserrat text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3">
            Путь рангов
          </h3>
          <div className="space-y-2">
            {RANKS.map((r, idx) => {
              const isCurrentRank = r.key === rank;
              const isAchieved = player.points >= r.threshold;
              return (
                <div
                  key={r.key}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{
                    background: isCurrentRank ? `${r.color}12` : 'hsl(var(--card))',
                    border: isCurrentRank ? `1px solid ${r.color}40` : '1px solid hsl(var(--border))',
                    opacity: isAchieved ? 1 : 0.45,
                  }}
                >
                  <span className="text-xl w-8 text-center">{r.emoji.split('').slice(0, 2).join('')}</span>
                  <div className="flex-1">
                    <div className="font-montserrat font-600 text-sm" style={{ color: isCurrentRank ? r.color : 'hsl(var(--foreground))' }}>
                      {r.label}
                    </div>
                    <div className="text-xs text-muted-foreground">от {r.threshold.toLocaleString()} очков</div>
                  </div>
                  {isCurrentRank && (
                    <span className="text-xs px-2 py-0.5 rounded font-600" style={{ background: `${r.color}20`, color: r.color }}>
                      Текущий
                    </span>
                  )}
                  {isAchieved && !isCurrentRank && (
                    <Icon name="Check" size={16} style={{ color: '#4CAF50' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed bonus tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="font-montserrat text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3">
              Выполненные задания
            </h3>
            <div className="space-y-2">
              {completedTasks.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,166,35,0.15)' }}
                    >
                      <Icon name="Star" size={13} style={{ color: 'var(--gold)' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-montserrat font-600 text-foreground truncate">{t.taskName}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.gameName}</div>
                    </div>
                  </div>
                  <span
                    className="font-montserrat font-700 text-xs ml-2 flex-shrink-0"
                    style={{ color: 'var(--gold)' }}
                  >
                    +{t.taskPoints}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-montserrat font-600 text-sm transition-colors"
            style={{ background: 'rgba(229,57,53,0.08)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)' }}
          >
            <Icon name="LogOut" size={15} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}