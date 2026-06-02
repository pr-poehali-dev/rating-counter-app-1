import { useAppState } from '@/hooks/useAppState';
import LoginScreen from '@/components/LoginScreen';
import PlayerProfileView from '@/components/PlayerProfileView';
import AppLayout from '@/components/AppLayout';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-montserrat font-black text-xl"
          style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}>S</div>
        <div className="text-xs text-muted-foreground animate-pulse">Загрузка...</div>
      </div>
    </div>
  );
}

export default function App() {
  const state = useAppState();

  const {
    activeTab, setActiveTab,
    players, games,
    playersLoaded, gamesLoaded,
    currentPlayer, currentPlayerId,
    isAdmin,
    viewingPlayerId,
    authLoading,
    victoryGame, setVictoryGame,
    handleLogin, handleLogout,
    handleViewPlayer, handleCloseViewPlayer,
    updatePlayer,
    createGame, joinGame, leaveGame,
    addPlayerToGame, removePlayerFromGame,
    createTeam, assignPlayerToTeam,
    startGame, finishGame,
    addBonusTask, completeBonusTask,
  } = state;

  // Показываем загрузку только если данных ещё нет вообще
  const hasData = players.length > 0;
  if ((!playersLoaded || !gamesLoaded) && !hasData && !currentPlayerId) {
    return <LoadingScreen />;
  }

  // Если не залогинен — экран входа
  if (!currentPlayer) {
    // Если ID есть но игроки ещё грузятся — показываем загрузку, не выбрасываем
    if (currentPlayerId && !playersLoaded) {
      return <LoadingScreen />;
    }
    return <LoginScreen players={players} onLogin={handleLogin} loading={authLoading} />;
  }

  // Просмотр профиля другого игрока
  const viewingPlayer = viewingPlayerId ? players.find(p => p.id === viewingPlayerId) : null;
  if (viewingPlayer) {
    return <PlayerProfileView player={viewingPlayer} allPlayers={players} games={games} onClose={handleCloseViewPlayer} />;
  }

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      players={players}
      games={games}
      currentPlayer={currentPlayer}
      currentPlayerId={currentPlayerId!}
      isAdmin={isAdmin}
      victoryGame={victoryGame}
      setVictoryGame={setVictoryGame}
      onViewPlayer={handleViewPlayer}
      onUpdatePlayer={(updates) => updatePlayer(currentPlayerId!, updates)}
      onLogout={handleLogout}
      onJoinGame={joinGame}
      onLeaveGame={leaveGame}
      onCreateGame={createGame}
      onAddPlayerToGame={addPlayerToGame}
      onRemovePlayerFromGame={removePlayerFromGame}
      onCreateTeam={createTeam}
      onAssignPlayerToTeam={assignPlayerToTeam}
      onStartGame={startGame}
      onFinishGame={finishGame}
      onAddBonusTask={addBonusTask}
      onCompleteBonusTask={completeBonusTask}
    />
  );
}
