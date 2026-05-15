import { Game, Player } from '@/data/store';
import Icon from '@/components/ui/icon';

interface GameCardBonusTasksProps {
  game: Game;
  currentPlayer: Player;
  isAdmin: boolean;
  iAmIn: boolean;
  onCompleteBonusTask: (gameId: string, taskId: string, playerId: string) => void;
}

export default function GameCardBonusTasks({
  game, currentPlayer, isAdmin, iAmIn, onCompleteBonusTask,
}: GameCardBonusTasksProps) {
  if (game.bonusTasks.length === 0) return null;

  return (
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
  );
}
