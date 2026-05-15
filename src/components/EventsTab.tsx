import { useState } from 'react';
import { Game, Player, Team, BonusTask, TEAM_COLORS } from '@/data/store';
import Icon from '@/components/ui/icon';

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

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
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

  function getPlayerInTeam(game: Game, playerId: string): Team | undefined {
    return game.teams.find(t => t.playerIds.includes(playerId));
  }

  const isPlayerInGame = (game: Game) => game.playerIds.includes(currentPlayer.id);

  function renderGameCard(game: Game) {
    const isExpanded = expandedGame === game.id;
    const gamePlayers = getGamePlayers(game);
    const iAmIn = isPlayerInGame(game);
    const myTeam = getPlayerInTeam(game, currentPlayer.id);

    return (
      <div key={game.id} className="card-surface overflow-hidden animate-fade-in">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setExpandedGame(isExpanded ? null : game.id)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-8 rounded-full"
              style={{
                background: game.status === 'recruiting' ? '#F5A623'
                  : game.status === 'active' ? '#4CAF50'
                  : '#6B7280',
              }}
            />
            <div>
              <div className="font-montserrat font-700 text-sm text-foreground">{game.title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="Users" size={11} />
                <span>{gamePlayers.length} игроков</span>
                <span className="mx-1">·</span>
                <span style={{
                  color: game.status === 'recruiting' ? 'var(--gold)'
                    : game.status === 'active' ? '#4CAF50'
                    : 'hsl(var(--muted-foreground))',
                }}>
                  {game.status === 'recruiting' ? 'Набор' : game.status === 'active' ? 'Активна' : 'Завершена'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Player join/leave */}
            {!isAdmin && game.status === 'recruiting' && (
              iAmIn ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onLeaveGame(game.id); }}
                  className="text-xs px-3 py-1.5 rounded font-600"
                  style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.3)' }}
                >
                  Выйти
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onJoinGame(game.id); }}
                  className="text-xs px-3 py-1.5 rounded font-600"
                  style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.3)' }}
                >
                  Вступить
                </button>
              )
            )}
            <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
            {/* Teams */}
            {game.teams.length > 0 && (
              <div>
                <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-2">
                  Команды
                </div>
                <div className="space-y-2">
                  {game.teams.map(team => {
                    const teamPlayers = players.filter(p => team.playerIds.includes(p.id));
                    const unassigned = gamePlayers.filter(p => !getPlayerInTeam(game, p.id));
                    return (
                      <div key={team.id} className="rounded-md p-3" style={{ background: `${team.color}12`, border: `1px solid ${team.color}40` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: team.color }} />
                            <span className="font-montserrat font-600 text-sm" style={{ color: team.color }}>
                              {team.name}
                            </span>
                            <span className="text-xs text-muted-foreground">({teamPlayers.length})</span>
                          </div>
                          {/* Declare winner button */}
                          {isAdmin && game.status === 'active' && !game.winnerTeamId && (
                            <button
                              onClick={() => onDeclareWinner(game.id, team.id)}
                              className="text-xs px-2 py-1 rounded font-600"
                              style={{ background: '#4CAF5020', color: '#4CAF50', border: '1px solid #4CAF5040' }}
                            >
                              🏆 Победа
                            </button>
                          )}
                          {game.winnerTeamId === team.id && (
                            <span className="text-xs px-2 py-1 rounded font-600" style={{ background: '#4CAF5020', color: '#4CAF50' }}>
                              🏆 Победитель
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {teamPlayers.map(p => (
                            <div key={p.id} className="flex items-center gap-1 text-xs bg-background rounded px-2 py-1">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: getAvatarColor(p.id), fontSize: '8px' }}>
                                {getInitials(p.name)}
                              </div>
                              <span className="text-foreground">{p.name.split(' ')[0]}</span>
                            </div>
                          ))}
                          {/* Assign player to team (admin) */}
                          {isAdmin && game.status !== 'finished' && unassigned.length > 0 && (
                            <button
                              onClick={() => setAssignTarget(assignTarget?.teamId === team.id ? null : { gameId: game.id, teamId: team.id })}
                              className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground"
                              style={{ border: '1px dashed hsl(var(--border))' }}
                            >
                              + игрок
                            </button>
                          )}
                        </div>
                        {/* Assign dropdown */}
                        {assignTarget?.teamId === team.id && isAdmin && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {gamePlayers.filter(p => !getPlayerInTeam(game, p.id)).map(p => (
                              <button
                                key={p.id}
                                onClick={() => { onAssignPlayerToTeam(game.id, team.id, p.id); setAssignTarget(null); }}
                                className="text-xs px-2 py-1 rounded"
                                style={{ background: `${team.color}20`, color: team.color, border: `1px solid ${team.color}40` }}
                              >
                                {p.name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unassigned players */}
            {(() => {
              const unassigned = gamePlayers.filter(p => !getPlayerInTeam(game, p.id));
              if (unassigned.length === 0) return null;
              return (
                <div>
                  <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-2">
                    Без команды
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unassigned.map(p => (
                      <div key={p.id} className="flex items-center gap-1 text-xs rounded px-2 py-1"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: getAvatarColor(p.id), fontSize: '8px' }}>
                          {getInitials(p.name)}
                        </div>
                        <span>{p.name.split(' ')[0]}</span>
                        {isAdmin && (
                          <button onClick={() => onRemovePlayerFromGame(game.id, p.id)}
                            className="ml-1 text-muted-foreground hover:text-red-400">
                            <Icon name="X" size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Bonus tasks */}
            {game.bonusTasks.length > 0 && (
              <div>
                <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-2">
                  Доп. задачи
                </div>
                <div className="space-y-1.5">
                  {game.bonusTasks.map(task => {
                    const alreadyDone = task.completedBy.includes(currentPlayer.id);
                    return (
                      <div key={task.id} className="flex items-center justify-between rounded p-2"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        <div>
                          <div className="text-xs font-600 text-foreground">{task.name}</div>
                          <div className="text-xs" style={{ color: 'var(--gold)' }}>+{task.points} очков</div>
                        </div>
                        {!isAdmin && !alreadyDone && iAmIn && game.status !== 'finished' && (
                          <button
                            onClick={() => onCompleteBonusTask(game.id, task.id, currentPlayer.id)}
                            className="text-xs px-2 py-1 rounded font-600"
                            style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.3)' }}
                          >
                            Выполнено
                          </button>
                        )}
                        {alreadyDone && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <Icon name="Check" size={12} /> Выполнено
                          </span>
                        )}
                        {isAdmin && (
                          <div className="text-xs text-muted-foreground">{task.completedBy.length} выполнили</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin controls */}
            {isAdmin && game.status !== 'finished' && (
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground">
                  Управление
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Add player */}
                  <button
                    onClick={() => setShowAddPlayer(showAddPlayer === game.id ? null : game.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  >
                    <Icon name="UserPlus" size={12} /> Добавить игрока
                  </button>

                  {/* Create team */}
                  <button
                    onClick={() => setShowCreateTeam(showCreateTeam === game.id ? null : game.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  >
                    <Icon name="Shield" size={12} /> Создать команду
                  </button>

                  {/* Bonus tasks */}
                  <button
                    onClick={() => setShowAddBonus(showAddBonus === game.id ? null : game.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  >
                    <Icon name="Star" size={12} /> Доп. задача
                  </button>

                  {/* Start game */}
                  {game.status === 'recruiting' && game.teams.length >= 2 && (
                    <button
                      onClick={() => onDeclareWinner(game.id, '')}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
                      style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
                    >
                      <Icon name="Play" size={12} /> Начать игру
                    </button>
                  )}
                </div>

                {/* Add player dropdown */}
                {showAddPlayer === game.id && (
                  <div className="rounded-md p-3 space-y-1.5" style={{ background: 'hsl(var(--muted))' }}>
                    <div className="text-xs text-muted-foreground mb-2">Добавить из списка:</div>
                    {getAvailablePlayers(game).length === 0 ? (
                      <div className="text-xs text-muted-foreground">Все игроки уже в игре</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {getAvailablePlayers(game).map(p => (
                          <button
                            key={p.id}
                            onClick={() => { onAddPlayerToGame(game.id, p.id); }}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          >
                            <div className="w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                              style={{ background: getAvatarColor(p.id), fontSize: '8px' }}>
                              {getInitials(p.name)}
                            </div>
                            {p.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Create team form */}
                {showCreateTeam === game.id && (
                  <div className="rounded-md p-3 space-y-2" style={{ background: 'hsl(var(--muted))' }}>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="Название команды"
                      className="w-full text-xs px-3 py-2 rounded outline-none"
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {TEAM_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setNewTeamColor(c.value)}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: c.value, outline: newTeamColor === c.value ? `2px solid white` : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleCreateTeam(game.id)}
                      className="text-xs px-4 py-2 rounded font-600 w-full"
                      style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
                    >
                      Создать
                    </button>
                  </div>
                )}

                {/* Add bonus task form */}
                {showAddBonus === game.id && (
                  <div className="rounded-md p-3 space-y-2" style={{ background: 'hsl(var(--muted))' }}>
                    <input
                      type="text"
                      value={newBonusName}
                      onChange={e => setNewBonusName(e.target.value)}
                      placeholder="Название задачи"
                      className="w-full text-xs px-3 py-2 rounded outline-none"
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    />
                    <input
                      type="number"
                      value={newBonusPoints}
                      onChange={e => setNewBonusPoints(e.target.value)}
                      placeholder="Очки"
                      className="w-full text-xs px-3 py-2 rounded outline-none"
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    />
                    <button
                      onClick={() => handleAddBonus(game.id)}
                      className="text-xs px-4 py-2 rounded font-600 w-full"
                      style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
                    >
                      Добавить задачу
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Player's team info */}
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
        {/* Header */}
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

        {/* Create game form */}
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

        {/* Active games */}
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

        {/* Finished games */}
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
