import { useState, useRef } from 'react';
import { Player, Game, getRank, getNextRankThreshold, isRankImage } from '@/data/store';
import Icon from '@/components/ui/icon';

function RankIcon({ val, size = 20 }: { val: string; size?: number }) {
  if (isRankImage(val)) return <img src={val} alt="rank" style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block', mixBlendMode: 'screen' }} />;
  return <span className="text-lg lg:text-xl">{val}</span>;
}

const TOP3_FLAME = [
  { ring: 'flame-ring-1', glow: '#9c27b0', heroBg: 'linear-gradient(180deg, rgba(74,20,140,0.35) 0%, rgba(0,0,0,0) 100%)', badge: '#ce93d8', badgeBg: 'rgba(156,39,176,0.15)', label: '🔥 1-е место' },
  { ring: 'flame-ring-2', glow: '#f5a623', heroBg: 'linear-gradient(180deg, rgba(230,115,0,0.25) 0%, rgba(0,0,0,0) 100%)', badge: '#ffe082', badgeBg: 'rgba(245,166,35,0.15)', label: '🔥 2-е место' },
  { ring: 'flame-ring-3', glow: '#e53935', heroBg: 'linear-gradient(180deg, rgba(183,28,28,0.25) 0%, rgba(0,0,0,0) 100%)', badge: '#ff5252', badgeBg: 'rgba(229,57,53,0.15)', label: '🔥 3-е место' },
];

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
  { key: 'rookie', label: 'Новобранец', emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/e7a7031a-aca7-4491-bcc2-14c2086ce132.png', threshold: 0, next: 5000, color: '#9CA3AF' },
  { key: 'wolf', label: 'Волк', emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/4db688e7-c3fb-469f-af8c-82790cf63902.png', threshold: 5000, next: 10000, color: '#6B7280' },
  { key: 'shark', label: 'Акула', emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/8f89b1e6-90d8-466e-a04f-fddb6cd10743.png', threshold: 10000, next: 15000, color: '#1E88E5' },
  { key: 'dragon', label: 'Дракон', emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/b5ded5b4-9f99-4143-a2d0-f14ce6c8fe95.png', threshold: 15000, next: 20000, color: '#E53935' },
  { key: 'skull', label: 'Владыка', emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/39af4433-12b1-43ff-b15d-cfde6640b51d.png', threshold: 20000, next: 25000, color: '#F5A623' },
  { key: 'queen', label: 'Фантом', emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/3ff69700-b79b-4582-a213-e7d53c92f746.jpg', threshold: 25000, next: 25000, color: '#9C27B0' },
];

export default function ProfileTab({ player, onUpdatePlayer, allPlayers, games, onLogout }: ProfileTabProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
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
  const flame = myRankIndex >= 1 && myRankIndex <= 3 ? TOP3_FLAME[myRankIndex - 1] : null;

  // Собираем все выполненные доп. задания игрока
  const completedTasks = games.flatMap(game =>
    game.bonusTasks
      .filter(task => task.completedBy.includes(player.id))
      .map(task => ({ taskName: task.name, taskPoints: task.points, gameName: game.title }))
  );

  // История игр игрока
  const myGames = games
    .filter(g => g.status === 'finished' && g.teams.some(t => t.playerIds.includes(player.id)))
    .sort((a, b) => b.id.localeCompare(a.id));

  function getMyPlacement(game: Game): number {
    const myTeam = game.teams.find(t => t.playerIds.includes(player.id));
    if (!myTeam) return -1;
    return game.placements.indexOf(myTeam.id);
  }

  function getMyDelta(game: Game): number {
    const placement = getMyPlacement(game);
    if (placement === -1) return 0;
    const n = game.placements.length;
    return placement === 0 ? (n - 1) * 100 : -placement * 100;
  }

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
    <div className="pb-6 lg:pb-10 animate-fade-in">
      {/* Profile hero */}
      <div className="relative px-4 lg:px-8 pt-4 lg:pt-8 pb-6 lg:pb-8"
        style={{ background: flame ? flame.heroBg : 'linear-gradient(180deg, hsl(220 14% 13%) 0%, rgba(0,0,0,0) 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: flame ? flame.glow : rankInfo.color }} />
        {flame && (
          <div className="absolute top-4 right-4 lg:top-8 lg:right-8 px-2.5 py-1 rounded-full font-montserrat font-700 text-xs"
            style={{ background: flame.badgeBg, color: flame.badge, border: `1px solid ${flame.badge}40` }}>
            {flame.label}
          </div>
        )}

        {/* Hero layout: horizontal on mobile, side-by-side with progress on desktop */}
        <div className="lg:flex lg:gap-10 lg:items-start">
          {/* Left: avatar + name */}
          <div className="flex items-center gap-4 lg:gap-5">
            <div className="relative flex-shrink-0">
              <div
                className={`w-20 h-20 lg:w-28 lg:h-28 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xl lg:text-3xl overflow-hidden border-2${flame ? ` ${flame.ring}` : ''}`}
                style={{ backgroundColor: getAvatarColor(player.id), borderColor: flame ? flame.badge : rankInfo.color, boxShadow: flame ? undefined : `0 0 20px ${rankInfo.color}50` }}
              >
                {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" alt="" /> : getInitials(player.name)}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--gold)', color: '#000' }}>
                <Icon name="Camera" size={12} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value.slice(0, 30))}
                      placeholder="Введите имя..."
                      className="flex-1 text-base lg:text-xl font-montserrat font-700 px-3 py-1.5 rounded-lg outline-none"
                      style={{ background: 'hsl(var(--muted))', border: `1px solid ${rankInfo.color}80`, color: 'hsl(var(--foreground))' }}
                      onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <button
                      onClick={handleSave}
                      disabled={!editName.trim()}
                      className="px-3 py-1.5 rounded-lg font-montserrat font-600 text-sm transition-opacity"
                      style={{ background: '#4CAF50', color: '#fff', opacity: editName.trim() ? 1 : 0.4 }}
                    >
                      <Icon name="Check" size={16} />
                    </button>
                    <button
                      onClick={() => { setEditName(player.name); setEditing(false); }}
                      className="px-3 py-1.5 rounded-lg"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground pl-1">{editName.length}/30 символов</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="font-montserrat font-800 text-lg lg:text-2xl text-foreground truncate">{player.name}</span>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md transition-all flex-shrink-0"
                    style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.25)' }}
                    title="Изменить имя"
                  >
                    <Icon name="Pen" size={12} />
                    <span className="text-xs font-montserrat font-600" style={{ fontSize: '11px' }}>Изменить</span>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <RankIcon val={rankInfo.emoji} size={56} />
                <span className="font-montserrat font-600 text-sm lg:text-base" style={{ color: rankInfo.color }}>{rankInfo.label}</span>
                {player.isAdmin && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-600"
                    style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', fontSize: '10px' }}>ADMIN</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs lg:text-sm text-muted-foreground">
                <Icon name="Trophy" size={11} />
                <span>#{myRankIndex} в рейтинге</span>
              </div>
            </div>
          </div>

          {/* Right: points + progress */}
          <div className="mt-5 lg:mt-0 lg:flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-montserrat font-900 text-3xl lg:text-5xl" style={{ color: rankInfo.color }}>
                {player.points.toLocaleString()}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground text-right">
                {rank !== 'queen' ? (
                  <>
                    <div>До {nextRank?.label}</div>
                    <div className="font-600 text-foreground">{(nextThreshold - player.points).toLocaleString()} очков</div>
                  </>
                ) : <div className="text-purple-400 font-600">Максимальный ранг</div>}
              </div>
            </div>
            <div className="w-full h-2 lg:h-3 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${rankInfo.color}80, ${rankInfo.color})` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{prevThreshold.toLocaleString()}</span>
              <span>{nextThreshold.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 lg:px-8 pt-2 pb-4">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
          {([
            { key: 'stats', label: 'Статистика', icon: 'BarChart2' },
            { key: 'history', label: 'История игр', icon: 'Gamepad2' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-montserrat font-600 transition-all"
              style={activeTab === tab.key
                ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
                : { color: 'hsl(var(--muted-foreground))' }}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {activeTab === 'stats' && <div className="px-4 lg:px-8 space-y-4 lg:space-y-6">
        <h3 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground">
          Статистика
        </h3>

        <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4">
          {[
            { label: 'Игр', value: player.gamesPlayed, color: 'hsl(var(--foreground))' },
            { label: 'Побед', value: player.wins, color: '#4CAF50' },
            { label: 'Поражений', value: player.losses, color: '#E53935' },
          ].map(stat => (
            <div key={stat.label} className="card-surface p-3 lg:p-5 text-center rounded-lg">
              <div className="font-montserrat font-800 text-xl lg:text-3xl" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs lg:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Win rate */}
        <div className="card-surface rounded-lg p-4 lg:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs lg:text-sm font-montserrat font-600 text-muted-foreground">Процент побед</span>
            <span className="font-montserrat font-700 text-sm lg:text-base" style={{ color: winRate >= 50 ? '#4CAF50' : '#E53935' }}>{winRate}%</span>
          </div>
          <div className="w-full h-1.5 lg:h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
            <div className="h-full rounded-full" style={{ width: `${winRate}%`, background: winRate >= 50 ? '#4CAF50' : '#E53935' }} />
          </div>
        </div>

        {/* Rank progression — 2 col on desktop */}
        <div>
          <h3 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground mb-3">
            Путь рангов
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
            {RANKS.map((r) => {
              const isCurrentRank = r.key === rank;
              const isAchieved = player.points >= r.threshold;
              return (
                <div key={r.key} className="flex items-center gap-3 rounded-lg p-3 lg:p-4"
                  style={{
                    background: isCurrentRank ? `${r.color}12` : 'hsl(var(--card))',
                    border: isCurrentRank ? `1px solid ${r.color}40` : '1px solid hsl(var(--border))',
                    opacity: isAchieved ? 1 : 0.45,
                  }}>
                  <div className="w-14 flex items-center justify-center"><RankIcon val={r.emoji} size={56} /></div>
                  <div className="flex-1">
                    <div className="font-montserrat font-600 text-sm lg:text-base" style={{ color: isCurrentRank ? r.color : 'hsl(var(--foreground))' }}>{r.label}</div>
                    <div className="text-xs text-muted-foreground">от {r.threshold.toLocaleString()} очков</div>
                  </div>
                  {isCurrentRank && (
                    <span className="text-xs px-2 py-0.5 rounded font-600" style={{ background: `${r.color}20`, color: r.color }}>Текущий</span>
                  )}
                  {isAchieved && !isCurrentRank && <Icon name="Check" size={16} style={{ color: '#4CAF50' }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed bonus tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground mb-3">
              Выполненные задания
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
              {completedTasks.map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5 lg:p-4"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,166,35,0.15)' }}>
                      <Icon name="Star" size={13} style={{ color: 'var(--gold)' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-montserrat font-600 text-foreground truncate">{t.taskName}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.gameName}</div>
                    </div>
                  </div>
                  <span className="font-montserrat font-700 text-xs lg:text-sm ml-2 flex-shrink-0" style={{ color: 'var(--gold)' }}>+{t.taskPoints}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="pt-2 lg:pt-4">
          <button onClick={onLogout}
            className="w-full lg:w-auto lg:px-8 flex items-center justify-center gap-2 py-3 rounded-lg font-montserrat font-600 text-sm lg:text-base transition-colors"
            style={{ background: 'rgba(229,57,53,0.08)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)' }}>
            <Icon name="LogOut" size={15} />
            Выйти из аккаунта
          </button>
        </div>
      </div>}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="px-4 lg:px-8 space-y-3 lg:space-y-4 pb-6">
          {myGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Icon name="Gamepad2" size={40} className="text-muted-foreground opacity-30" />
              <div className="text-muted-foreground text-sm">Ещё не было сыграно ни одной игры</div>
            </div>
          ) : (
            myGames.map(game => {
              const placement = getMyPlacement(game);
              const delta = getMyDelta(game);
              const isWin = placement === 0;
              const totalTeams = game.placements.length;
              const myTeam = game.teams.find(t => t.playerIds.includes(player.id));
              const teammates = myTeam?.playerIds
                .filter(id => id !== player.id)
                .map(id => allPlayers.find(p => p.id === id)?.name)
                .filter(Boolean) ?? [];

              return (
                <div key={game.id} className="rounded-xl overflow-hidden"
                  style={{
                    border: `1px solid ${isWin ? 'rgba(76,175,80,0.35)' : 'rgba(229,57,53,0.25)'}`,
                    background: isWin
                      ? 'linear-gradient(90deg, rgba(76,175,80,0.08), hsl(var(--card)))'
                      : 'linear-gradient(90deg, rgba(229,57,53,0.07), hsl(var(--card)))',
                  }}>
                  <div className="flex items-center gap-3 p-3 lg:p-4">
                    {/* Result icon */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 font-montserrat font-800 text-base lg:text-lg"
                      style={{
                        background: isWin ? 'rgba(76,175,80,0.15)' : 'rgba(229,57,53,0.12)',
                        color: isWin ? '#4CAF50' : '#E53935',
                        border: `1px solid ${isWin ? 'rgba(76,175,80,0.4)' : 'rgba(229,57,53,0.3)'}`,
                      }}>
                      {isWin ? '🏆' : `#${placement + 1}`}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-700 text-sm lg:text-base text-foreground truncate">{game.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-600" style={{ color: isWin ? '#4CAF50' : '#E53935' }}>
                          {isWin ? 'Победа' : `${placement + 1} из ${totalTeams}`}
                        </span>
                        {teammates.length > 0 && (
                          <>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-xs text-muted-foreground truncate">
                              с {teammates.slice(0, 2).join(', ')}{teammates.length > 2 ? ` +${teammates.length - 2}` : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Points delta */}
                    <div className="flex-shrink-0 font-montserrat font-700 text-sm lg:text-base"
                      style={{ color: delta >= 0 ? '#4CAF50' : '#E53935' }}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Logout in history tab too */}
          <div className="pt-2 lg:pt-4">
            <button onClick={onLogout}
              className="w-full lg:w-auto lg:px-8 flex items-center justify-center gap-2 py-3 rounded-lg font-montserrat font-600 text-sm lg:text-base transition-colors"
              style={{ background: 'rgba(229,57,53,0.08)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)' }}>
              <Icon name="LogOut" size={15} />
              Выйти из аккаунта
            </button>
          </div>
        </div>
      )}
    </div>
  );
}