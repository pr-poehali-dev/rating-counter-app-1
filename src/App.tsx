import { useState, useEffect } from 'react';
import { Player, Game, Team } from '@/data/store';
import LeaderboardTab from '@/components/LeaderboardTab';
import EventsTab from '@/components/EventsTab';
import ProfileTab from '@/components/ProfileTab';
import LoginScreen from '@/components/LoginScreen';
import PlayerProfileView from '@/components/PlayerProfileView';
import Icon from '@/components/ui/icon';

const API_AUTH    = 'https://functions.poehali.dev/60849d96-2815-4a4a-8191-ba7b14448f64';
const API_PLAYERS = 'https://functions.poehali.dev/bef8ca0b-1403-449d-b4a0-55ffe3af9432';

let nextId = 100;
function uid() { return String(++nextId); }

function loadLocal<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveLocal(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'events' | 'profile'>('leaderboard');
  // players — загружаются с сервера, дополняются локально для игр
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>(() => loadLocal('sb_games', []));
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => loadLocal('sb_current_player', null));
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [playersLoaded, setPlayersLoaded] = useState(false);

  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const isAdmin = currentPlayer?.isAdmin ?? false;

  // Загружаем всех игроков с сервера при старте и периодически
  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPlayers() {
    try {
      const res = await fetch(API_PLAYERS);
      const data = await res.json();
      const serverPlayers: Player[] = (data.players || []).map((p: Player) => ({ ...p, password: '' }));
      setPlayers(serverPlayers);
      setPlayersLoaded(true);
    } catch { setPlayersLoaded(true); }
  }

  useEffect(() => { saveLocal('sb_games', games); }, [games]);
  useEffect(() => { saveLocal('sb_current_player', currentPlayerId); }, [currentPlayerId]);

  // --- Auth ---
  async function handleLogin(email: string, password: string, name: string): Promise<string | null> {
    setAuthLoading(true);
    try {
      const action = name ? 'register' : 'login';
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, password, name }),
      });
      const raw = await res.json();
      // платформа может вернуть body как строку
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (!res.ok) return data.error || 'Ошибка';

      const player: Player = { ...data.player, password: '' };
      setPlayers(prev => {
        const exists = prev.find(p => p.id === player.id);
        return exists ? prev.map(p => p.id === player.id ? player : p) : [...prev, player];
      });
      setCurrentPlayerId(player.id);
      return null;
    } catch {
      return 'Ошибка соединения';
    } finally {
      setAuthLoading(false);
    }
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
    // Синхронизируем с сервером
    fetch(API_PLAYERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    }).then(() => fetchPlayers()).catch(() => {});
  }

  // --- Games ---
  function createGame(title: string) {
    const newGame: Game = {
      id: uid(), title, status: 'recruiting',
      teams: [], playerIds: [], winnerTeamId: null,
      bonusTasks: [], createdAt: new Date().toISOString(),
    };
    setGames(prev => [newGame, ...prev]);
  }

  function joinGame(gameId: string) {
    if (!currentPlayerId) return;
    setGames(prev => prev.map(g =>
      g.id === gameId && !g.playerIds.includes(currentPlayerId)
        ? { ...g, playerIds: [...g.playerIds, currentPlayerId] } : g
    ));
  }

  function leaveGame(gameId: string) {
    if (!currentPlayerId) return;
    setGames(prev => prev.map(g =>
      g.id === gameId ? {
        ...g,
        playerIds: g.playerIds.filter(id => id !== currentPlayerId),
        teams: g.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(id => id !== currentPlayerId) })),
      } : g
    ));
  }

  function addPlayerToGame(gameId: string, playerId: string) {
    setGames(prev => prev.map(g =>
      g.id === gameId && !g.playerIds.includes(playerId)
        ? { ...g, playerIds: [...g.playerIds, playerId] } : g
    ));
  }

  function removePlayerFromGame(gameId: string, playerId: string) {
    setGames(prev => prev.map(g =>
      g.id === gameId ? {
        ...g,
        playerIds: g.playerIds.filter(id => id !== playerId),
        teams: g.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(id => id !== playerId) })),
      } : g
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
          const without = { ...t, playerIds: t.playerIds.filter(id => id !== playerId) };
          return t.id === teamId ? { ...without, playerIds: [...without.playerIds, playerId] } : without;
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
    const pointsPerWinner = Math.floor((loserPlayerIds.length * 100) / winnerCount);

    setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: 'finished', winnerTeamId } : g));

    // Обновляем очки локально и на сервере
    const updatedPlayers = players.map(p => {
      if (winnerTeam.playerIds.includes(p.id))
        return { ...p, points: p.points + pointsPerWinner, wins: p.wins + 1, gamesPlayed: p.gamesPlayed + 1 };
      if (loserPlayerIds.includes(p.id))
        return { ...p, points: Math.max(0, p.points - 100), losses: p.losses + 1, gamesPlayed: p.gamesPlayed + 1 };
      return p;
    });
    setPlayers(updatedPlayers);

    // Синхронизируем с сервером
    const toSync = updatedPlayers.filter(p =>
      winnerTeam.playerIds.includes(p.id) || loserPlayerIds.includes(p.id)
    );
    toSync.forEach(p => {
      fetch(API_PLAYERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, updates: { points: p.points, wins: p.wins, losses: p.losses, gamesPlayed: p.gamesPlayed } }),
      }).catch(() => {});
    });
  }

  function addBonusTask(gameId: string, taskName: string, taskPoints: number) {
    const newTask = { id: uid(), name: taskName, points: taskPoints, completedBy: [] };
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, bonusTasks: [...g.bonusTasks, newTask] } : g));
  }

  function completeBonusTask(gameId: string, taskId: string, playerId: string) {
    const game = games.find(g => g.id === gameId);
    const task = game?.bonusTasks.find(t => t.id === taskId);
    if (!task || task.completedBy.includes(playerId)) return;

    setGames(prev => prev.map(g =>
      g.id === gameId ? {
        ...g,
        bonusTasks: g.bonusTasks.map(t => t.id === taskId ? { ...t, completedBy: [...t.completedBy, playerId] } : t),
      } : g
    ));

    const newPoints = (players.find(p => p.id === playerId)?.points ?? 0) + task.points;
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, points: p.points + task.points } : p));
    fetch(API_PLAYERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: playerId, updates: { points: newPoints } }),
    }).catch(() => {});
  }

  // --- Not logged in ---
  if (!playersLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-montserrat font-black text-xl"
            style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
          >S</div>
          <div className="text-xs text-muted-foreground animate-pulse">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!currentPlayer) {
    return <LoginScreen players={players} onLogin={handleLogin} loading={authLoading} />;
  }

  // --- Viewing another player ---
  const viewingPlayer = viewingPlayerId ? players.find(p => p.id === viewingPlayerId) : null;
  if (viewingPlayer) {
    return <PlayerProfileView player={viewingPlayer} allPlayers={players} onClose={handleCloseViewPlayer} />;
  }

  const tabs = [
    { key: 'leaderboard' as const, label: 'Рейтинг', icon: 'Trophy' as const },
    { key: 'events' as const, label: 'События', icon: 'Crosshair' as const },
    { key: 'profile' as const, label: 'Профиль', icon: 'User' as const },
  ];

  const avatarColors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <div
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'hsl(220 16% 7%)', borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-montserrat font-black text-xs"
            style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
          >S</div>
          <div>
            <div className="font-montserrat font-black text-sm text-foreground leading-tight">СТРАЙКБОЛ</div>
            <div className="text-muted-foreground leading-tight" style={{ fontSize: '10px' }}>Рейтинговая система</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="px-2 py-0.5 rounded font-montserrat font-bold"
              style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)', fontSize: '10px' }}>
              ADMIN
            </span>
          )}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-xs overflow-hidden"
            style={{ background: avatarColors[parseInt(currentPlayerId!) % avatarColors.length] }}
          >
            {currentPlayer.avatar
              ? <img src={currentPlayer.avatar} className="w-full h-full object-cover" alt="" />
              : currentPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-20">
        {activeTab === 'leaderboard' && (
          <LeaderboardTab players={players} currentPlayerId={currentPlayerId!} onPlayerClick={handleViewPlayer} />
        )}
        {activeTab === 'events' && (
          <EventsTab
            games={games} players={players} currentPlayer={currentPlayer} isAdmin={isAdmin}
            onJoinGame={joinGame} onLeaveGame={leaveGame} onCreateGame={createGame}
            onAddPlayerToGame={addPlayerToGame} onRemovePlayerFromGame={removePlayerFromGame}
            onCreateTeam={createTeam} onAssignPlayerToTeam={assignPlayerToTeam}
            onDeclareWinner={declareWinner} onAddBonusTask={addBonusTask}
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

      <div className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'hsl(220 16% 7%)', borderTop: '1px solid hsl(var(--border))' }}>
        <div className="max-w-lg mx-auto flex relative">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors duration-150"
                style={{ color: isActive ? 'var(--gold)' : 'hsl(var(--muted-foreground))' }}>
                <Icon name={tab.icon} size={20} />
                <span className="font-montserrat font-semibold" style={{ fontSize: '10px' }}>{tab.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-b-full"
                    style={{ background: 'var(--gold)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}