import { useState } from 'react';
import { Game, Player, Team, TEAM_COLORS } from '@/data/store';
import Icon from '@/components/ui/icon';
import GameCardHeader from '@/components/events/GameCardHeader';
import GameCardTeams from '@/components/events/GameCardTeams';
import GameCardBonusTasks from '@/components/events/GameCardBonusTasks';
import GameCardAdminControls from '@/components/events/GameCardAdminControls';

interface EventsTabProps {
  games: Game[];
  players: Player[];
  currentPlayer: Player;
  isAdmin: boolean;
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
  onCreateGame: (title: string) => void;
  onAddPlayerToGame: (gameId: string, playerId: string) => void;
  onRemovePlayerFromGame: (gameId: string, playerId: string) => void;
  onCreateTeam: (gameId: string, teamName: string, teamColor: string) => void;
  onAssignPlayerToTeam: (gameId: string, teamId: string, playerId: string) => void;
  onDeclareWinner: (gameId: string, winnerTeamId: string) => void;
  onAddBonusTask: (gameId: string, taskName: string, taskPoints: number) => void;
  onCompleteBonusTask: (gameId: string, taskId: string, playerId: string) => void;
}

function getPlayerInTeam(game: Game, playerId: string): Team | undefined {
  return game.teams.find(t => t.playerIds.includes(playerId));
}

export default function EventsTab({
  games, players, currentPlayer, isAdmin,
  onJoinGame, onLeaveGame, onCreateGame,
  onAddPlayerToGame, onRemovePlayerFromGame,
  onCreateTeam, onAssignPlayerToTeam, onDeclareWinner,
  onAddBonusTask, onCompleteBonusTask,
}: EventsTabProps) {
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState<string | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0].value);
  const [showBonusTasks, setShowBonusTasks] = useState<string | null>(null);
  const [showAddBonus, setShowAddBonus] = useState<string | null>(null);
  const [newBonusName, setNewBonusName] = useState('');
  const [newBonusPoints, setNewBonusPoints] = useState('100');
  const [assignTarget, setAssignTarget] = useState<{ gameId: string; teamId: string } | null>(null);

  const activeGames = games.filter(g => g.status !== 'finished');
  const finishedGames = games.filter(g => g.status === 'finished');

  function handleCreateGame() {
    if (!newGameTitle.trim()) return;
    onCreateGame(newGameTitle.trim());
    setNewGameTitle('');
    setShowCreateGame(false);
  }

  function handleCreateTeam(gameId: string) {
    if (!newTeamName.trim()) return;
    onCreateTeam(gameId, newTeamName.trim(), newTeamColor);
    setNewTeamName('');
    setNewTeamColor(TEAM_COLORS[0].value);
    setShowCreateTeam(null);
  }

  function handleAddBonus(gameId: string) {
    const pts = parseInt(newBonusPoints);
    if (!newBonusName.trim() || isNaN(pts) || pts <= 0) return;
    onAddBonusTask(gameId, newBonusName.trim(), pts);
    setNewBonusName('');
    setNewBonusPoints('100');
    setShowAddBonus(null);
  }

  function getGamePlayers(game: Game): Player[] {
    return players.filter(p => game.playerIds.includes(p.id));
  }

  function getAvailablePlayers(game: Game): Player[] {
    return players.filter(p => !game.playerIds.includes(p.id));
  }

  function renderGameCard(game: Game) {
    const isExpanded = expandedGame === game.id;
    const gamePlayers = getGamePlayers(game);
    const iAmIn = game.playerIds.includes(currentPlayer.id);
    const myTeam = getPlayerInTeam(game, currentPlayer.id);

    return (
      <div key={game.id} className="card-surface overflow-hidden animate-fade-in">
        <GameCardHeader
          game={game}
          gamePlayers={gamePlayers}
          isAdmin={isAdmin}
          isExpanded={isExpanded}
          iAmIn={iAmIn}
          onToggleExpand={() => setExpandedGame(isExpanded ? null : game.id)}
          onJoinGame={onJoinGame}
          onLeaveGame={onLeaveGame}
        />

        {isExpanded && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
            <GameCardTeams
              game={game}
              players={players}
              gamePlayers={gamePlayers}
              isAdmin={isAdmin}
              assignTarget={assignTarget}
              onDeclareWinner={onDeclareWinner}
              onAssignPlayerToTeam={onAssignPlayerToTeam}
              onRemovePlayerFromGame={onRemovePlayerFromGame}
              onSetAssignTarget={setAssignTarget}
              getPlayerInTeam={getPlayerInTeam}
            />

            <GameCardBonusTasks
              game={game}
              currentPlayer={currentPlayer}
              isAdmin={isAdmin}
              iAmIn={iAmIn}
              onCompleteBonusTask={onCompleteBonusTask}
            />

            {isAdmin && (
              <GameCardAdminControls
                game={game}
                availablePlayers={getAvailablePlayers(game)}
                showAddPlayer={showAddPlayer}
                showCreateTeam={showCreateTeam}
                showAddBonus={showAddBonus}
                newTeamName={newTeamName}
                newTeamColor={newTeamColor}
                newBonusName={newBonusName}
                newBonusPoints={newBonusPoints}
                onSetShowAddPlayer={setShowAddPlayer}
                onSetShowCreateTeam={setShowCreateTeam}
                onSetShowAddBonus={setShowAddBonus}
                onSetNewTeamName={setNewTeamName}
                onSetNewTeamColor={setNewTeamColor}
                onSetNewBonusName={setNewBonusName}
                onSetNewBonusPoints={setNewBonusPoints}
                onAddPlayerToGame={onAddPlayerToGame}
                onDeclareWinner={onDeclareWinner}
                onCreateTeam={handleCreateTeam}
                onAddBonus={handleAddBonus}
              />
            )}

            {!isAdmin && myTeam && (
              <div className="pt-1 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Ваша команда: <span className="font-600" style={{ color: myTeam.color }}>{myTeam.name}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-6 animate-fade-in">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat text-xs font-700 uppercase tracking-widest text-muted-foreground">
            Активные события
          </h2>
          {isAdmin && (
            <button
              onClick={() => setShowCreateGame(!showCreateGame)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md font-600"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              <Icon name="Plus" size={12} /> Новая игра
            </button>
          )}
        </div>

        {showCreateGame && isAdmin && (
          <div className="mb-4 rounded-lg p-4 space-y-3 animate-scale-in" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="text-sm font-montserrat font-600 text-foreground">Создать игру</div>
            <input
              type="text"
              value={newGameTitle}
              onChange={e => setNewGameTitle(e.target.value)}
              placeholder="Название игры"
              className="w-full text-sm px-3 py-2 rounded outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              onKeyDown={e => e.key === 'Enter' && handleCreateGame()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGame}
                className="flex-1 text-sm py-2 rounded font-600"
                style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
              >
                Создать
              </button>
              <button
                onClick={() => setShowCreateGame(false)}
                className="px-4 text-sm py-2 rounded font-600 text-muted-foreground"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {activeGames.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-sm text-muted-foreground">Нет активных игр</div>
            {isAdmin && (
              <div className="text-xs text-muted-foreground mt-1">Создайте новую игру выше</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeGames.map(renderGameCard)}
          </div>
        )}

        {finishedGames.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-montserrat font-700 uppercase tracking-widest text-muted-foreground mb-3">
              Завершённые
            </div>
            <div className="space-y-2">
              {finishedGames.map(renderGameCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
