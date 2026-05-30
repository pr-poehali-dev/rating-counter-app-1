import { useState } from 'react';
import { Player, Game, Team, initialPlayers } from '@/data/store';
import LeaderboardTab from '@/components/LeaderboardTab';
import EventsTab from '@/components/EventsTab';
import ProfileTab from '@/components/ProfileTab';
import LoginScreen from '@/components/LoginScreen';
import PlayerProfileView from '@/components/PlayerProfileView';
import Icon from '@/components/ui/icon';

// Admin emails
const ADMIN_EMAILS = ['dmitry.ilyin@example.com'];

let nextId = 100;
function uid() { return String(++nextId); }

export default function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'events' | 'profile'>('leaderboard');
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [games, setGames] = useState<Game[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const isAdmin = currentPlayer?.isAdmin ?? false;

  // --- Auth ---
  function handleLogin(email: string, password: string, name: string): string | null {
    const existing = players.find(p => p.email === email);
    if (existing) {
      if (existing.password !== password) return 'Неверный пароль';
      setCurrentPlayerId(existing.id);
      return null;
    }
    // Registration
    const newPlayer: Player = {
      id: uid(),
      name,
      email,
      password,
      avatar: '',
      points: 0,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      joinDate: new Date().toISOString().slice(0, 10),
      isAdmin: ADMIN_EMAILS.includes(email),
    };
    setPlayers(prev => [...prev, newPlayer]);
    setCurrentPlayerId(newPlayer.id);
    return null;
  }

  function handleLogout() {
    setCurrentPlayerId(null);
    setViewingPlayerId(null);
    setActiveTab('leaderboard');
  }

  function handleViewPlayer(playerId: string) {
    setViewingPlayerId(playerId);
    setActiveTab('profile');
  }

  function handleCloseViewPlayer() {
    setViewingPlayerId(null);
  }

  // --- Player ---
  function updatePlayer(id: string, updates: Partial<Player>) {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  // --- Games ---
  function createGame(title: string) {
    const newGame: Game = {
      id: uid(),
      title,
      status: 'recruiting',
      teams: [],
      playerIds: [],
      winnerTeamId: null,
      bonusTasks: [],
      createdAt: new Date().toISOString(),
    };
    setGames(prev => [newGame, ...prev]);
  }

  function joinGame(gameId: string) {
    if (!currentPlayerId) return;
    setGames(prev => prev.map(g =>
      g.id === gameId && !g.playerIds.includes(currentPlayerId)
        ? { ...g, playerIds: [...g.playerIds, currentPlayerId] }
        : g
    ));
  }

  function leaveGame(gameId: string) {
    if (!currentPlayerId) return;
    setGames(prev => prev.map(g =>
      g.id === gameId
        ? {
          ...g,
          playerIds: g.playerIds.filter(id => id !== currentPlayerId),
          teams: g.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(id => id !== currentPlayerId) })),
        }
        : g
    ));
  }

  function addPlayerToGame(gameId: string, playerId: string) {
    setGames(prev => prev.map(g =>
      g.id === gameId && !g.playerIds.includes(playerId)
        ? { ...g, playerIds: [...g.playerIds, playerId] }
        : g
    ));
  }

  function removePlayerFromGame(gameId: string, playerId: string) {
    setGames(prev => prev.map(g =>
      g.id === gameId
        ? {
          ...g,
          playerIds: g.playerIds.filter(id => id !== playerId),
          teams: g.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(id => id !== playerId) })),
        }
        : g
    ));
  }

  function createTeam(gameId: string, teamName: string, teamColor: string) {
    const newTeam: Team = { id: uid(), name: teamName, color: teamColor, playerIds: [] };
    setGames(prev => prev.map(g =>
      g.id === gameId ? { ...g, teams: [...g.teams, newTeam], status: 'active' } : g
    ));
  }

  function assignPlayerToTeam(gameId: string, teamId: string, playerId: string) {
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      return {
        ...g,
        teams: g.teams.map(t => {
          const withoutPlayer = { ...t, playerIds: t.playerIds.filter(id => id !== playerId) };
          if (t.id === teamId) {
            return { ...withoutPlayer, playerIds: [...withoutPlayer.playerIds, playerId] };
          }
          return withoutPlayer;
        }),
      };
    }));
  }

  function declareWinner(gameId: string, winnerTeamId: string) {
    if (!winnerTeamId) {
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: 'active' } : g));
      return;
    }

    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const winnerTeam = game.teams.find(t => t.id === winnerTeamId);
    const loserTeams = game.teams.filter(t => t.id !== winnerTeamId);
    if (!winnerTeam) return;

    const loserPlayerIds = loserTeams.flatMap(t => t.playerIds);
    const winnerCount = winnerTeam.playerIds.length || 1;
    const totalPoints = loserPlayerIds.length * 100;
    const pointsPerWinner = Math.floor(totalPoints / winnerCount);

    setGames(prev => prev.map(g =>
      g.id === gameId ? { ...g, status: 'finished', winnerTeamId } : g
    ));

    setPlayers(prev => prev.map(p => {
      if (winnerTeam.playerIds.includes(p.id)) {
        return { ...p, points: p.points + pointsPerWinner, wins: p.wins + 1, gamesPlayed: p.gamesPlayed + 1 };
      }
      if (loserPlayerIds.includes(p.id)) {
        return { ...p, points: Math.max(0, p.points - 100), losses: p.losses + 1, gamesPlayed: p.gamesPlayed + 1 };
      }
      return p;
    }));
  }

  function addBonusTask(gameId: string, taskName: string, taskPoints: number) {
    const newTask = { id: uid(), name: taskName, points: taskPoints, completedBy: [] };
    setGames(prev => prev.map(g =>
      g.id === gameId ? { ...g, bonusTasks: [...g.bonusTasks, newTask] } : g
    ));
  }

  function completeBonusTask(gameId: string, taskId: string, playerId: string) {
    const game = games.find(g => g.id === gameId);
    const task = game?.bonusTasks.find(t => t.id === taskId);
    if (!task || task.completedBy.includes(playerId)) return;

    setGames(prev => prev.map(g =>
      g.id === gameId
        ? { ...g, bonusTasks: g.bonusTasks.map(t => t.id === taskId ? { ...t, completedBy: [...t.completedBy, playerId] } : t) }
        : g
    ));

    setPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, points: p.points + task.points } : p
    ));
  }

  // --- Not logged in ---
  if (!currentPlayer) {
    return <LoginScreen players={players} onLogin={handleLogin} />;
  }

  // --- Viewing another player's profile ---
  const viewingPlayer = viewingPlayerId ? players.find(p => p.id === viewingPlayerId) : null;
  if (viewingPlayer) {
    return (
      <PlayerProfileView
        player={viewingPlayer}
        allPlayers={players}
        onClose={handleCloseViewPlayer}
      />
    );
  }

  const tabs = [
    { key: 'leaderboard' as const, label: 'Рейтинг', icon: 'Trophy' as const },
    { key: 'events' as const, label: 'События', icon: 'Crosshair' as const },
    { key: 'profile' as const, label: 'Профиль', icon: 'User' as const },
  ];

  const avatarColors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Top header */}
      <div
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'hsl(220 16% 7%)', borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-montserrat font-black text-xs"
            style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
          >
            S
          </div>
          <div>
            <div className="font-montserrat font-black text-sm text-foreground leading-tight">СТРАЙКБОЛ</div>
            <div className="text-muted-foreground leading-tight" style={{ fontSize: '10px' }}>
              Рейтинговая система
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span
              className="px-2 py-0.5 rounded font-montserrat font-bold"
              style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)', fontSize: '10px' }}
            >
              ADMIN
            </span>
          )}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xs overflow-hidden"
            style={{ background: avatarColors[parseInt(currentPlayerId!) % avatarColors.length] }}
          >
            {currentPlayer.avatar ? (
              <img src={currentPlayer.avatar} className="w-full h-full object-cover" alt="" />
            ) : currentPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto pb-20">
        {activeTab === 'leaderboard' && (
          <LeaderboardTab players={players} currentPlayerId={currentPlayerId!} onPlayerClick={handleViewPlayer} />
        )}
        {activeTab === 'events' && (
          <EventsTab
            games={games}
            players={players}
            currentPlayer={currentPlayer}
            isAdmin={isAdmin}
            onJoinGame={joinGame}
            onLeaveGame={leaveGame}
            onCreateGame={createGame}
            onAddPlayerToGame={addPlayerToGame}
            onRemovePlayerFromGame={removePlayerFromGame}
            onCreateTeam={createTeam}
            onAssignPlayerToTeam={assignPlayerToTeam}
            onDeclareWinner={declareWinner}
            onAddBonusTask={addBonusTask}
            onCompleteBonusTask={completeBonusTask}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            player={currentPlayer}
            onUpdatePlayer={(updates) => updatePlayer(currentPlayerId!, updates)}
            allPlayers={players}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'hsl(220 16% 7%)', borderTop: '1px solid hsl(var(--border))' }}
      >
        <div className="max-w-lg mx-auto flex relative">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors duration-150"
                style={{ color: isActive ? 'var(--gold)' : 'hsl(var(--muted-foreground))' }}
              >
                <Icon name={tab.icon} size={20} />
                <span className="font-montserrat font-semibold" style={{ fontSize: '10px' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-b-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}