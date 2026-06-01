import { Player, Game, getRank, getNextRankThreshold, isRankImage } from '@/data/store';
import Icon from '@/components/ui/icon';

function RankIcon({ val, size = 20 }: { val: string; size?: number }) {
  if (isRankImage(val)) return <img src={val} alt="rank" style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }} />;
  return <span className="text-lg lg:text-xl">{val}</span>;
}

const TOP3_FLAME = [
  { ring: 'flame-ring-1', glow: '#9c27b0', heroBg: 'linear-gradient(180deg, rgba(74,20,140,0.35) 0%, rgba(0,0,0,0) 100%)', badge: '#ce93d8', badgeBg: 'rgba(156,39,176,0.15)', label: '🔥 1-е место' },
  { ring: 'flame-ring-2', glow: '#f5a623', heroBg: 'linear-gradient(180deg, rgba(230,115,0,0.25) 0%, rgba(0,0,0,0) 100%)', badge: '#ffe082', badgeBg: 'rgba(245,166,35,0.15)', label: '🔥 2-е место' },
  { ring: 'flame-ring-3', glow: '#e53935', heroBg: 'linear-gradient(180deg, rgba(183,28,28,0.25) 0%, rgba(0,0,0,0) 100%)', badge: '#ff5252', badgeBg: 'rgba(229,57,53,0.15)', label: '🔥 3-е место' },
];

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const RANKS = [
  { key: 'rookie', label: 'Новобранец', emoji: '🎯', threshold: 0, color: '#9CA3AF' },
  { key: 'wolf',   label: 'Волк',          emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/4db688e7-c3fb-469f-af8c-82790cf63902.png', threshold: 5000,  color: '#6B7280' },
  { key: 'shark',  label: 'Акула',         emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/8f89b1e6-90d8-466e-a04f-fddb6cd10743.png', threshold: 10000, color: '#1E88E5' },
  { key: 'dragon', label: 'Дракон',        emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/b5ded5b4-9f99-4143-a2d0-f14ce6c8fe95.png', threshold: 15000, color: '#E53935' },
  { key: 'skull',  label: 'Владыка',       emoji: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/39af4433-12b1-43ff-b15d-cfde6640b51d.png', threshold: 20000, color: '#F5A623' },
  { key: 'queen',  label: 'Королева тьмы', emoji: '👸', threshold: 25000, color: '#9C27B0' },
];

interface PlayerProfileViewProps {
  player: Player;
  allPlayers: Player[];
  games: Game[];
  onClose: () => void;
}

export default function PlayerProfileView({ player, allPlayers, games, onClose }: PlayerProfileViewProps) {
  const rank = getRank(player.points);
  const rankInfo = RANKS.find(r => r.key === rank)!;
  const nextThreshold = getNextRankThreshold(player.points);
  const prevThreshold = rankInfo.threshold;
  const progress = rank === 'queen' ? 100
    : Math.round(((player.points - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
  const nextRankInfo = RANKS[RANKS.findIndex(r => r.key === rank) + 1];

  const winRate = player.gamesPlayed > 0
    ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;

  const completedTasks = games.flatMap(game =>
    game.bonusTasks
      .filter(task => task.completedBy.includes(player.id))
      .map(task => ({ taskName: task.name, taskPoints: task.points, gameName: game.title }))
  );

  const rankIndex = [...allPlayers].sort((a, b) => b.points - a.points).findIndex(p => p.id === player.id) + 1;
  const flame = rankIndex >= 1 && rankIndex <= 3 ? TOP3_FLAME[rankIndex - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Animated fire background */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 55% at 50% 130%, #ff6a00 0%, #ff4500 30%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 130%, #ff8c00 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 130%, #ff4500 0%, transparent 65%), #000`,
        backgroundSize: '200% 200%, 150% 150%, 150% 150%, 100% 100%',
        animation: 'fireBg 5s ease-in-out infinite, fireOpacity 3s ease-in-out infinite',
      }} />
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ position: 'relative', zIndex: 1, background: 'rgba(5,5,8,0.75)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border))' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>
        <span className="font-montserrat font-700 text-sm text-foreground">Профиль игрока</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6 lg:pb-10 w-full" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-5xl xl:max-w-6xl mx-auto">
        {/* Hero */}
        <div className="relative px-4 lg:px-8 pt-6 lg:pt-8 pb-6 lg:pb-8"
          style={{ background: flame ? flame.heroBg : 'linear-gradient(180deg, hsl(220 14% 13%) 0%, rgba(0,0,0,0) 100%)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: flame ? flame.glow : rankInfo.color }} />
          {flame && (
            <div className="absolute top-4 right-4 lg:top-8 lg:right-8 px-2.5 py-1 rounded-full font-montserrat font-700 text-xs"
              style={{ background: flame.badgeBg, color: flame.badge, border: `1px solid ${flame.badge}40` }}>
              {flame.label}
            </div>
          )}

          <div className="lg:flex lg:gap-10 lg:items-start">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 lg:gap-5">
              <div
                className={`w-20 h-20 lg:w-28 lg:h-28 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xl lg:text-3xl overflow-hidden border-2 flex-shrink-0${flame ? ` ${flame.ring}` : ''}`}
                style={{ backgroundColor: getAvatarColor(player.id), borderColor: flame ? flame.badge : rankInfo.color, boxShadow: flame ? undefined : `0 0 20px ${rankInfo.color}50` }}
              >
                {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" alt="" /> : getInitials(player.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-montserrat font-black text-lg lg:text-2xl text-foreground truncate">{player.name}</span>
                  {player.isAdmin && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-600"
                      style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', fontSize: '10px' }}>ADMIN</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <RankIcon val={rankInfo.emoji} size={24} />
                  <span className="font-montserrat font-600 text-sm lg:text-base" style={{ color: rankInfo.color }}>{rankInfo.label}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs lg:text-sm text-muted-foreground">
                  <Icon name="Trophy" size={11} />
                  <span>#{rankIndex} в рейтинге</span>
                </div>
              </div>
            </div>

            {/* Points + progress */}
            <div className="mt-5 lg:mt-0 lg:flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="font-montserrat font-black text-3xl lg:text-5xl" style={{ color: rankInfo.color }}>
                  {player.points.toLocaleString()}
                </div>
                <div className="text-xs lg:text-sm text-muted-foreground text-right">
                  {rank !== 'queen' ? (
                    <>
                      <div>До {nextRankInfo?.label}</div>
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

        {/* Stats */}
        <div className="px-4 lg:px-8 space-y-4 lg:space-y-6">
          <h3 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground">Статистика</h3>

          <div className="grid grid-cols-3 gap-3 lg:gap-4">
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

          <div className="card-surface rounded-lg p-4 lg:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs lg:text-sm font-montserrat font-600 text-muted-foreground">Процент побед</span>
              <span className="font-montserrat font-700 text-sm lg:text-base" style={{ color: winRate >= 50 ? '#4CAF50' : '#E53935' }}>{winRate}%</span>
            </div>
            <div className="w-full h-1.5 lg:h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
              <div className="h-full rounded-full" style={{ width: `${winRate}%`, background: winRate >= 50 ? '#4CAF50' : '#E53935' }} />
            </div>
          </div>

          {/* Rank path */}
          <h3 className="font-montserrat text-xs lg:text-sm font-700 uppercase tracking-widest text-muted-foreground">Путь рангов</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
            {RANKS.map(r => {
              const isCurrentRank = r.key === rank;
              const isAchieved = player.points >= r.threshold;
              return (
                <div key={r.key} className="flex items-center gap-3 rounded-lg p-3 lg:p-4"
                  style={{
                    background: isCurrentRank ? `${r.color}12` : 'hsl(var(--card))',
                    border: isCurrentRank ? `1px solid ${r.color}40` : '1px solid hsl(var(--border))',
                    opacity: isAchieved ? 1 : 0.45,
                  }}>
                  <div className="w-8 flex items-center justify-center"><RankIcon val={r.emoji} size={28} /></div>
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
                    <span className="font-montserrat font-700 text-xs ml-2 flex-shrink-0" style={{ color: 'var(--gold)' }}>
                      +{t.taskPoints}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}