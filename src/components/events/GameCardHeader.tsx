import { Game, Player } from '@/data/store';
import Icon from '@/components/ui/icon';

interface GameCardHeaderProps {
  game: Game;
  gamePlayers: Player[];
  isAdmin: boolean;
  isExpanded: boolean;
  iAmIn: boolean;
  onToggleExpand: () => void;
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
}

export default function GameCardHeader({
  game, gamePlayers, isAdmin, isExpanded, iAmIn,
  onToggleExpand, onJoinGame, onLeaveGame,
}: GameCardHeaderProps) {
  return (
    <div
      className="flex items-center justify-between p-4 cursor-pointer"
      onClick={onToggleExpand}
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
  );
}
