import { Player, Game } from '@/data/store';
import LeaderboardTab from '@/components/LeaderboardTab';
import EventsTab from '@/components/EventsTab';
import ProfileTab from '@/components/ProfileTab';
import VictoryModal from '@/components/VictoryModal';
import Icon from '@/components/ui/icon';

const TABS = [
  { key: 'leaderboard' as const, label: 'Рейтинг', icon: 'Trophy' as const },
  { key: 'events' as const, label: 'События', icon: 'Crosshair' as const },
  { key: 'profile' as const, label: 'Профиль', icon: 'User' as const },
];

const AVATAR_COLORS = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];

interface AppLayoutProps {
  activeTab: 'leaderboard' | 'events' | 'profile';
  setActiveTab: (tab: 'leaderboard' | 'events' | 'profile') => void;
  players: Player[];
  games: Game[];
  currentPlayer: Player;
  currentPlayerId: string;
  isAdmin: boolean;
  victoryGame: { name: string } | null;
  setVictoryGame: (v: { name: string } | null) => void;
  onViewPlayer: (id: string) => void;
  onUpdatePlayer: (updates: Partial<Player>) => void;
  onLogout: () => void;
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
  onCreateGame: (title: string) => void;
  onAddPlayerToGame: (gameId: string, playerId: string) => void;
  onRemovePlayerFromGame: (gameId: string, playerId: string) => void;
  onCreateTeam: (gameId: string, teamName: string, teamColor: string) => void;
  onAssignPlayerToTeam: (gameId: string, teamId: string, playerId: string) => void;
  onStartGame: (gameId: string) => void;
  onFinishGame: (gameId: string, placements: string[]) => void;
  onAddBonusTask: (gameId: string, taskName: string, taskPoints: number) => void;
  onCompleteBonusTask: (gameId: string, taskId: string, playerId: string) => void;
}

export default function AppLayout({
  activeTab, setActiveTab,
  players, games,
  currentPlayer, currentPlayerId, isAdmin,
  victoryGame, setVictoryGame,
  onViewPlayer, onUpdatePlayer, onLogout,
  onJoinGame, onLeaveGame, onCreateGame,
  onAddPlayerToGame, onRemovePlayerFromGame,
  onCreateTeam, onAssignPlayerToTeam,
  onStartGame, onFinishGame,
  onAddBonusTask, onCompleteBonusTask,
}: AppLayoutProps) {
  const avatarBg = AVATAR_COLORS[parseInt(currentPlayerId) % AVATAR_COLORS.length];
  const visibleGames = games.filter(g => g.status !== 'archived');

  function AvatarEl({ size }: { size: string }) {
    return (
      <div className={`${size} rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xs overflow-hidden flex-shrink-0`}
        style={{ background: avatarBg }}>
        {currentPlayer.avatar
          ? <img src={currentPlayer.avatar} className="w-full h-full object-cover" alt="" />
          : currentPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
    );
  }

  function FireBg() {
    return (
      <div aria-hidden style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 55% at 50% 130%, #ff6a00 0%, #ff4500 30%, transparent 70%),radial-gradient(ellipse 50% 40% at 20% 130%, #ff8c00 0%, transparent 65%),radial-gradient(ellipse 50% 40% at 80% 130%, #ff4500 0%, transparent 65%),radial-gradient(ellipse 35% 30% at 50% 120%, #ffaa00 0%, transparent 60%),#000`,
        backgroundSize: '200% 200%, 150% 150%, 150% 150%, 120% 120%, 100% 100%',
        animation: 'fireBg 5s ease-in-out infinite, fireOpacity 3s ease-in-out infinite',
      }} />
    );
  }

  const eventsProps = {
    games: visibleGames, players, currentPlayer, isAdmin,
    onJoinGame, onLeaveGame, onCreateGame,
    onAddPlayerToGame, onRemovePlayerFromGame,
    onCreateTeam, onAssignPlayerToTeam,
    onStartGame, onFinishGame,
    onAddBonusTask, onCompleteBonusTask,
  };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <FireBg />

      {/* ===== MOBILE layout (< lg) ===== */}
      <div className="lg:hidden flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
        {/* Mobile header */}
        <div className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(5,5,8,0.75)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center font-montserrat font-black text-xs"
              style={{ background: 'var(--gold)', color: '#000' }}>S</div>
            <div>
              <div className="font-montserrat font-black text-sm text-foreground leading-tight">СТРАЙКБОЛ</div>
              <div className="text-muted-foreground leading-tight" style={{ fontSize: '10px' }}>Рейтинговая система</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <span className="px-2 py-0.5 rounded font-montserrat font-bold"
              style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)', fontSize: '10px' }}>ADMIN</span>}
            <AvatarEl size="w-8 h-8" />
          </div>
        </div>

        {/* Mobile content */}
        <div className="flex-1 pb-20">
          {activeTab === 'leaderboard' && <LeaderboardTab players={players} currentPlayerId={currentPlayerId} onPlayerClick={onViewPlayer} />}
          {activeTab === 'events' && <EventsTab {...eventsProps} />}
          {activeTab === 'profile' && <ProfileTab player={currentPlayer}
            onUpdatePlayer={onUpdatePlayer}
            allPlayers={players} games={games} onLogout={onLogout} />}
        </div>

        {/* Mobile bottom tabbar */}
        <div className="fixed bottom-0 left-0 right-0 z-50"
          style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(12px)', borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors duration-150"
                  style={{ color: isActive ? 'var(--gold)' : 'hsl(var(--muted-foreground))' }}>
                  <Icon name={tab.icon} size={20} />
                  <span className="font-montserrat font-semibold" style={{ fontSize: '10px' }}>{tab.label}</span>
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-b-full" style={{ background: 'var(--gold)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP layout (>= lg) ===== */}
      <div className="hidden lg:flex min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
        {/* Sidebar */}
        <aside className="w-64 xl:w-72 flex-shrink-0 flex flex-col sticky top-0 h-screen"
          style={{ background: 'rgba(5,5,8,0.82)', backdropFilter: 'blur(16px)', borderRight: '1px solid hsl(var(--border))' }}>
          {/* Logo */}
          <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-montserrat font-black text-base"
              style={{ background: 'var(--gold)', color: '#000' }}>S</div>
            <div>
              <div className="font-montserrat font-black text-base text-foreground leading-tight">СТРАЙКБОЛ</div>
              <div className="text-muted-foreground" style={{ fontSize: '11px' }}>Рейтинговая система</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: isActive ? 'rgba(245,166,35,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
                    color: isActive ? 'var(--gold)' : 'hsl(var(--muted-foreground))',
                  }}>
                  <Icon name={tab.icon} size={18} />
                  <span className="font-montserrat font-semibold text-sm">{tab.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />}
                </button>
              );
            })}
          </nav>

          {/* User card */}
          <div className="px-3 py-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid hsl(var(--border))' }}>
              <AvatarEl size="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <div className="font-montserrat font-700 text-sm text-foreground truncate">{currentPlayer.name}</div>
                <div className="text-xs text-muted-foreground">{currentPlayer.points.toLocaleString()} очков</div>
              </div>
              {isAdmin && <span className="px-1.5 py-0.5 rounded font-montserrat font-bold flex-shrink-0"
                style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)', fontSize: '9px' }}>ADM</span>}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl xl:max-w-6xl mx-auto">
            {activeTab === 'leaderboard' && <LeaderboardTab players={players} currentPlayerId={currentPlayerId} onPlayerClick={onViewPlayer} />}
            {activeTab === 'events' && <EventsTab {...eventsProps} />}
            {activeTab === 'profile' && <ProfileTab player={currentPlayer}
              onUpdatePlayer={onUpdatePlayer}
              allPlayers={players} games={games} onLogout={onLogout} />}
          </div>
        </main>
      </div>

      {victoryGame && (
        <VictoryModal gameName={victoryGame.name} onClose={() => setVictoryGame(null)} />
      )}
    </div>
  );
}
