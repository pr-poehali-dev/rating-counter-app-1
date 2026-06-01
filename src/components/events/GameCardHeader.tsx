import { Game, Player } from '@/data/store';
import Icon from '@/components/ui/icon';

interface GameCardHeaderProps {
  game: Game;
  gamePlayers: Player[];
  isAdmin: boolean;
  isExpanded: boolean;
  iAmIn: boolean;
  currentPlayerId: string;
  onToggleExpand: () => void;
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
}

export default function GameCardHeader({
  game, gamePlayers, isAdmin, isExpanded, iAmIn, currentPlayerId,
  onToggleExpand, onJoinGame, onLeaveGame,
}: GameCardHeaderProps) {
  // Определяем результат для текущего игрока в завершённой игре
  let resultStyle: React.CSSProperties = {};
  let resultBadge: React.ReactNode = null;

  if (game.status === 'finished' && iAmIn) {
    const myTeam = game.teams.find(t => t.playerIds.includes(currentPlayerId));
    if (myTeam) {
      const placement = game.placements.indexOf(myTeam.id);
      const isWinner = placement === 0;
      if (isWinner) {
        resultStyle = {
          background: 'linear-gradient(90deg, rgba(76,175,80,0.12), rgba(10,10,14,0.55))',
          borderLeft: '3px solid #4CAF50',
        };
        resultBadge = (
          <span className="text-xs px-2 py-0.5 rounded font-montserrat font-700"
            style={{ background: 'rgba(76,175,80,0.18)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.35)' }}>
            🏆 Победа
          </span>
        );
      } else {
        resultStyle = {
          background: 'linear-gradient(90deg, rgba(229,57,53,0.10), rgba(10,10,14,0.55))',
          borderLeft: '3px solid #E53935',
        };
        resultBadge = (
          <span className="text-xs px-2 py-0.5 rounded font-montserrat font-700"
            style={{ background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.3)' }}>
            #{placement + 1} место
          </span>
        );
      }
    }
  }

  return (
    <div
      className="flex items-center justify-between p-4 cursor-pointer"
      style={resultStyle}
      onClick={onToggleExpand}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-8 rounded-full flex-shrink-0"
          style={{
            background: game.status === 'recruiting' ? '#F5A623'
              : game.status === 'active' ? '#4CAF50'
              : iAmIn
                ? (game.placements.indexOf(game.teams.find(t => t.playerIds.includes(currentPlayerId))?.id ?? '') === 0 ? '#4CAF50' : '#E53935')
                : '#6B7280',
          }}
        />
        <div>
          <div className="font-montserrat font-700 text-sm text-foreground">{game.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
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
            {resultBadge && <>{resultBadge}</>}
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
