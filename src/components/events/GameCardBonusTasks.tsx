import { useState } from 'react';
import { Game, Player } from '@/data/store';
import Icon from '@/components/ui/icon';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
}

interface GameCardBonusTasksProps {
  game: Game;
  players: Player[];
  currentPlayer: Player;
  isAdmin: boolean;
  iAmIn: boolean;
  onCompleteBonusTask: (gameId: string, taskId: string, playerId: string) => void;
}

export default function GameCardBonusTasks({
  game, players, currentPlayer, isAdmin, iAmIn, onCompleteBonusTask,
}: GameCardBonusTasksProps) {
  // taskId → открытый пикер игрока для этой задачи
  const [pickerOpenTask, setPickerOpenTask] = useState<string | null>(null);

  if (game.bonusTasks.length === 0) return null;

  // Игроки, участвующие в игре
  const gamePlayers = players.filter(p => game.playerIds.includes(p.id));

  return (
    <div>
      <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-2">
        Доп. задачи
      </div>
      <div className="space-y-2">
        {game.bonusTasks.map(task => {
          const alreadyDone = task.completedBy.includes(currentPlayer.id);
          const completedPlayers = players.filter(p => task.completedBy.includes(p.id));
          const isPickerOpen = pickerOpenTask === task.id;

          // Игроки в игре, которые ещё не выполнили задачу
          const eligiblePlayers = gamePlayers.filter(p => !task.completedBy.includes(p.id));

          return (
            <div
              key={task.id}
              className="rounded-lg overflow-hidden"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
            >
              {/* Task row */}
              <div className="flex items-center justify-between p-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-600 text-foreground">{task.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--gold)' }}>
                    +{task.points} очков
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {/* Игрок отмечает сам */}
                  {!isAdmin && !alreadyDone && iAmIn && game.status !== 'finished' && (
                    <button
                      onClick={() => onCompleteBonusTask(game.id, task.id, currentPlayer.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-600"
                      style={{
                        background: 'rgba(245,166,35,0.15)',
                        color: 'var(--gold)',
                        border: '1px solid rgba(245,166,35,0.3)',
                      }}
                    >
                      Выполнено
                    </button>
                  )}

                  {/* Сам выполнил — статус */}
                  {!isAdmin && alreadyDone && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Icon name="Check" size={12} /> Выполнено
                    </span>
                  )}

                  {/* Админ: кнопка отметить игрока */}
                  {isAdmin && game.status !== 'finished' && (
                    <button
                      onClick={() => setPickerOpenTask(isPickerOpen ? null : task.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-600 flex items-center gap-1.5"
                      style={{
                        background: isPickerOpen ? 'rgba(245,166,35,0.2)' : 'hsl(var(--card))',
                        color: isPickerOpen ? 'var(--gold)' : 'hsl(var(--foreground))',
                        border: `1px solid ${isPickerOpen ? 'rgba(245,166,35,0.4)' : 'hsl(var(--border))'}`,
                      }}
                    >
                      <Icon name="UserCheck" size={12} />
                      Отметить игрока
                    </button>
                  )}


                </div>
              </div>

              {/* Выполнившие игроки */}
              {completedPlayers.length > 0 && (
                <div
                  className="flex flex-wrap gap-1.5 px-2.5 pb-2.5"
                >
                  {completedPlayers.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5"
                      style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50' }}
                    >
                      <Icon name="Check" size={10} />
                      {p.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              )}

              {/* Пикер игрока (только для админа) */}
              {isAdmin && isPickerOpen && (
                <div
                  className="px-2.5 pb-2.5 pt-0"
                >
                  <div
                    className="rounded-lg p-2.5"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="text-xs text-muted-foreground mb-2">
                      Выберите игрока, который выполнил задачу:
                    </div>
                    {eligiblePlayers.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">
                        Все участники игры уже отмечены
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {eligiblePlayers.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onCompleteBonusTask(game.id, task.id, p.id);
                              // Оставляем пикер открытым, чтобы отметить ещё
                            }}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                            style={{
                              background: 'hsl(var(--muted))',
                              border: '1px solid hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                              style={{ background: getAvatarColor(p.id), fontSize: '8px' }}
                            >
                              {getInitials(p.name)}
                            </div>
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setPickerOpenTask(null)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Icon name="X" size={11} /> Закрыть
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}