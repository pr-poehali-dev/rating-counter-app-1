import { useState, useEffect } from 'react';
import { Player, Game, Team } from '@/data/store';
import {
  API_AUTH, API_PLAYERS, API_GAMES,
  uid, loadLocal, saveLocal,
  loadAvatarCache, saveAvatarToCache, mergeAvatars,
} from '@/lib/appUtils';

export function useAppState() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'events' | 'profile'>('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoaded, setGamesLoaded] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => loadLocal('sb_current_player', null));
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [victoryGame, setVictoryGame] = useState<{ name: string } | null>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const isAdmin = currentPlayer?.isAdmin ?? false;

  useEffect(() => {
    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll(isInitial = false) {
    try {
      const savedPlayerId = loadLocal<string | null>('sb_current_player', null);
      const requests: Promise<Response>[] = [fetch(API_GAMES)];
      if (savedPlayerId) {
        requests.push(fetch(`${API_PLAYERS}?id=${savedPlayerId}`));
      }
      const responses = await Promise.all(requests);
      if (!responses[0].ok) throw new Error(`HTTP ${responses[0].status}`);

      const raw = await responses[0].json();
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

      let myAvatar = '';
      if (responses[1]) {
        try {
          const avatarRaw = await responses[1].json();
          const avatarData = typeof avatarRaw === 'string' ? JSON.parse(avatarRaw) : avatarRaw;
          myAvatar = avatarData.player?.avatar || '';
        } catch { /* игнорируем */ }
      }

      const freshAvatars: Record<string, string> = {};
      if (savedPlayerId && myAvatar) {
        saveAvatarToCache(savedPlayerId, myAvatar);
        freshAvatars[savedPlayerId] = myAvatar;
      }

      const serverPlayers: Player[] = (data.players || []).map((p: Player) => ({
        ...p,
        password: '',
      }));

      if (serverPlayers.length > 0) {
        setPlayers(mergeAvatars(serverPlayers, freshAvatars));
      }
      setPlayersLoaded(true);

      const serverGames: Game[] = (data.games || []).map((g: Game) => ({ placements: [], ...g }));

      if (serverGames.length === 0) {
        const local = (loadLocal('sb_games', []) as Game[]).map(g => ({ placements: [], ...g }));
        if (local.length > 0) {
          setGames(local);
          local.forEach(g => syncGame(g));
          localStorage.removeItem('sb_games');
          setGamesLoaded(true);
          return;
        }
      }

      // Мержим серверные игры с локальными: локальные игры которых нет на сервере
      // (ещё не сохранились) не теряются — они остаются и уйдут на сервер при следующем syncGame
      setGames(prev => {
        const serverIds = new Set(serverGames.map(g => g.id));
        const localOnly = prev.filter(g => !serverIds.has(g.id));
        // Локальные игры которых нет на сервере — сразу пробуем сохранить
        localOnly.forEach(g => syncGame(g));
        return [...serverGames, ...localOnly];
      });
      setGamesLoaded(true);
    } catch {
      setPlayersLoaded(true);
      setGamesLoaded(true);
      if (isInitial) {
        setTimeout(() => fetchAll(false), 3000);
      }
    }
  }

  async function syncGame(game: Game, retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(API_GAMES, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game }),
        });
        if (res.ok) return true;
      } catch { /* продолжаем */ }
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
    return false;
  }

  useEffect(() => { saveLocal('sb_current_player', currentPlayerId); }, [currentPlayerId]);

  useEffect(() => {
    if (!currentPlayerId) return;
    const alreadyHasAvatar = players.find(p => p.id === currentPlayerId)?.avatar;
    if (alreadyHasAvatar) return;
    fetch(`${API_PLAYERS}?id=${currentPlayerId}`)
      .then(r => r.json())
      .then(raw => {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const avatar = data.player?.avatar;
        if (avatar) {
          saveAvatarToCache(currentPlayerId, avatar);
          setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, avatar } : p));
        }
      })
      .catch(() => {});
  }, [currentPlayerId, players.length]);

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
    // Всегда запрашиваем свежий аватар — кеш мог устареть если игрок его сменил
    fetch(`${API_PLAYERS}?id=${playerId}`)
      .then(r => r.json())
      .then(raw => {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const avatar = data.player?.avatar;
        if (avatar) {
          saveAvatarToCache(playerId, avatar);
          setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, avatar } : p));
        }
      })
      .catch(() => {});
  }

  function handleCloseViewPlayer() {
    setViewingPlayerId(null);
  }

  // --- Player ---
  function updatePlayer(id: string, updates: Partial<Player>) {
    if (updates.avatar) saveAvatarToCache(id, updates.avatar);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    fetch(API_PLAYERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    }).catch(() => {});
  }

  // --- Games ---
  function createGame(title: string) {
    const newGame: Game = {
      id: uid(), title, status: 'recruiting',
      teams: [], playerIds: [], winnerTeamId: null,
      placements: [], bonusTasks: [], createdAt: new Date().toISOString(),
    };
    setGames(prev => [newGame, ...prev]);
    syncGame(newGame);
  }

  function joinGame(gameId: string) {
    if (!currentPlayerId) return;
    setGames(prev => {
      const next = prev.map(g =>
        g.id === gameId && !g.playerIds.includes(currentPlayerId)
          ? { ...g, playerIds: [...g.playerIds, currentPlayerId] } : g
      );
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function leaveGame(gameId: string) {
    if (!currentPlayerId) return;
    setGames(prev => {
      const next = prev.map(g =>
        g.id === gameId ? {
          ...g,
          playerIds: g.playerIds.filter(id => id !== currentPlayerId),
          teams: g.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(id => id !== currentPlayerId) })),
        } : g
      );
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function addPlayerToGame(gameId: string, playerId: string) {
    setGames(prev => {
      const next = prev.map(g =>
        g.id === gameId && !g.playerIds.includes(playerId)
          ? { ...g, playerIds: [...g.playerIds, playerId] } : g
      );
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function removePlayerFromGame(gameId: string, playerId: string) {
    setGames(prev => {
      const next = prev.map(g =>
        g.id === gameId ? {
          ...g,
          playerIds: g.playerIds.filter(id => id !== playerId),
          teams: g.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(id => id !== playerId) })),
        } : g
      );
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function createTeam(gameId: string, teamName: string, teamColor: string) {
    const newTeam: Team = { id: uid(), name: teamName, color: teamColor, playerIds: [] };
    setGames(prev => {
      const next = prev.map(g =>
        g.id === gameId ? { ...g, teams: [...g.teams, newTeam], status: 'active' } : g
      );
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function assignPlayerToTeam(gameId: string, teamId: string, playerId: string) {
    setGames(prev => {
      const next = prev.map(g => {
        if (g.id !== gameId) return g;
        return {
          ...g,
          teams: g.teams.map(t => {
            const without = { ...t, playerIds: t.playerIds.filter(id => id !== playerId) };
            return t.id === teamId ? { ...without, playerIds: [...without.playerIds, playerId] } : without;
          }),
        };
      });
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function startGame(gameId: string) {
    setGames(prev => {
      const next = prev.map(g => g.id === gameId ? { ...g, status: 'active' } : g);
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  async function finishGame(gameId: string, placements: string[]) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const n = placements.length;
    const finishedGame = { ...game, status: 'finished' as const, placements, winnerTeamId: placements[0] ?? null };

    setGames(prev => prev.map(g => g.id === gameId ? finishedGame : g));

    const saved = await syncGame(finishedGame);
    if (!saved) {
      // Не удалось сохранить — откатываем игру обратно в активное состояние
      setGames(prev => prev.map(g => g.id === gameId ? game : g));
      alert('Не удалось сохранить результаты. Проверьте соединение и попробуйте снова.');
      return;
    }

    if (currentPlayerId) {
      const winnerTeamId = placements[0];
      const winnerTeam = game.teams.find(t => t.id === winnerTeamId);
      if (winnerTeam?.playerIds.includes(currentPlayerId)) {
        setVictoryGame({ name: game.title });
      }
    }

    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map(p => {
        const teamIdx = placements.findIndex(teamId => {
          const team = game.teams.find(t => t.id === teamId);
          return team?.playerIds.includes(p.id);
        });
        if (teamIdx === -1) return p;

        const delta = teamIdx === 0 ? (n - 1) * 100 : -teamIdx * 100;
        const isWinner = teamIdx === 0;
        const isLoser = teamIdx > 0;

        return {
          ...p,
          points: Math.max(0, p.points + delta),
          wins: p.wins + (isWinner ? 1 : 0),
          losses: p.losses + (isLoser ? 1 : 0),
          gamesPlayed: p.gamesPlayed + 1,
        };
      });

      const allGamePlayerIds = placements.flatMap(teamId =>
        game.teams.find(t => t.id === teamId)?.playerIds ?? []
      );
      updatedPlayers.filter(p => allGamePlayerIds.includes(p.id)).forEach(p => {
        fetch(API_PLAYERS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, updates: { points: p.points, wins: p.wins, losses: p.losses, gamesPlayed: p.gamesPlayed } }),
        }).catch(() => {});
      });

      return updatedPlayers;
    });
  }

  function addBonusTask(gameId: string, taskName: string, taskPoints: number) {
    const newTask = { id: uid(), name: taskName, points: taskPoints, completedBy: [] };
    setGames(prev => {
      const next = prev.map(g => g.id === gameId ? { ...g, bonusTasks: [...g.bonusTasks, newTask] } : g);
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });
  }

  function completeBonusTask(gameId: string, taskId: string, playerId: string) {
    const game = games.find(g => g.id === gameId);
    const task = game?.bonusTasks.find(t => t.id === taskId);
    if (!task || task.completedBy.includes(playerId)) return;

    setGames(prev => {
      const next = prev.map(g =>
        g.id === gameId ? {
          ...g,
          bonusTasks: g.bonusTasks.map(t => t.id === taskId ? { ...t, completedBy: [...t.completedBy, playerId] } : t),
        } : g
      );
      const updated = next.find(g => g.id === gameId);
      if (updated) syncGame(updated);
      return next;
    });

    const newPoints = (players.find(p => p.id === playerId)?.points ?? 0) + task.points;
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, points: p.points + task.points } : p));
    fetch(API_PLAYERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: playerId, updates: { points: newPoints } }),
    }).catch(() => {});
  }

  return {
    // state
    activeTab, setActiveTab,
    players,
    games,
    gamesLoaded,
    playersLoaded,
    currentPlayerId,
    currentPlayer,
    isAdmin,
    viewingPlayerId,
    authLoading,
    victoryGame, setVictoryGame,
    // actions
    handleLogin,
    handleLogout,
    handleViewPlayer,
    handleCloseViewPlayer,
    updatePlayer,
    createGame,
    joinGame,
    leaveGame,
    addPlayerToGame,
    removePlayerFromGame,
    createTeam,
    assignPlayerToTeam,
    startGame,
    finishGame,
    addBonusTask,
    completeBonusTask,
  };
}