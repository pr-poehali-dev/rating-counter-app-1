import { Game, Player, TEAM_COLORS } from '@/data/store';
import Icon from '@/components/ui/icon';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
}

interface GameCardAdminControlsProps {
  game: Game;
  availablePlayers: Player[];
  showAddPlayer: string | null;
  showCreateTeam: string | null;
  showAddBonus: string | null;
  newTeamName: string;
  newTeamColor: string;
  newBonusName: string;
  newBonusPoints: string;
  onSetShowAddPlayer: (val: string | null) => void;
  onSetShowCreateTeam: (val: string | null) => void;
  onSetShowAddBonus: (val: string | null) => void;
  onSetNewTeamName: (val: string) => void;
  onSetNewTeamColor: (val: string) => void;
  onSetNewBonusName: (val: string) => void;
  onSetNewBonusPoints: (val: string) => void;
  onAddPlayerToGame: (gameId: string, playerId: string) => void;
  onStartGame: (gameId: string) => void;
  onOpenFinishModal: () => void;
  onCreateTeam: (gameId: string) => void;
  onAddBonus: (gameId: string) => void;
}

export default function GameCardAdminControls({
  game, availablePlayers,
  showAddPlayer, showCreateTeam, showAddBonus,
  newTeamName, newTeamColor, newBonusName, newBonusPoints,
  onSetShowAddPlayer, onSetShowCreateTeam, onSetShowAddBonus,
  onSetNewTeamName, onSetNewTeamColor, onSetNewBonusName, onSetNewBonusPoints,
  onAddPlayerToGame, onStartGame, onOpenFinishModal, onCreateTeam, onAddBonus,
}: GameCardAdminControlsProps) {
  if (game.status === 'finished') return null;

  return (
    <div className="space-y-2 pt-1 border-t border-border">
      <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground">
        Управление
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSetShowAddPlayer(showAddPlayer === game.id ? null : game.id)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
        >
          <Icon name="UserPlus" size={12} /> Добавить игрока
        </button>

        <button
          onClick={() => onSetShowCreateTeam(showCreateTeam === game.id ? null : game.id)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
        >
          <Icon name="Shield" size={12} /> Создать команду
        </button>

        <button
          onClick={() => onSetShowAddBonus(showAddBonus === game.id ? null : game.id)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
        >
          <Icon name="Star" size={12} /> Доп. задача
        </button>

        {/* Начать игру */}
        {game.status === 'recruiting' && game.teams.length >= 2 && (
          <button
            onClick={() => onStartGame(game.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
            style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
          >
            <Icon name="Play" size={12} /> Начать игру
          </button>
        )}

        {/* Завершить с местами */}
        {game.status === 'active' && game.teams.length >= 2 && (
          <button
            onClick={onOpenFinishModal}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-600"
            style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.3)' }}
          >
            <Icon name="Trophy" size={12} /> Завершить игру
          </button>
        )}
      </div>

      {/* Add player dropdown */}
      {showAddPlayer === game.id && (
        <div className="rounded-md p-3 space-y-1.5" style={{ background: 'hsl(var(--muted))' }}>
          <div className="text-xs text-muted-foreground mb-2">Добавить из списка:</div>
          {availablePlayers.length === 0 ? (
            <div className="text-xs text-muted-foreground">Все игроки уже в игре</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availablePlayers.map(p => (
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
            onChange={e => onSetNewTeamName(e.target.value)}
            placeholder="Название команды"
            className="w-full text-xs px-3 py-2 rounded outline-none"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
          <div className="flex flex-wrap gap-1.5">
            {TEAM_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => onSetNewTeamColor(c.value)}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: c.value, outline: newTeamColor === c.value ? `2px solid white` : 'none', outlineOffset: '2px' }}
              />
            ))}
          </div>
          <button
            onClick={() => onCreateTeam(game.id)}
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
            onChange={e => onSetNewBonusName(e.target.value)}
            placeholder="Название задачи"
            className="w-full text-xs px-3 py-2 rounded outline-none"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
          <input
            type="number"
            value={newBonusPoints}
            onChange={e => onSetNewBonusPoints(e.target.value)}
            placeholder="Очки"
            className="w-full text-xs px-3 py-2 rounded outline-none"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
          <button
            onClick={() => onAddBonus(game.id)}
            className="text-xs px-4 py-2 rounded font-600 w-full"
            style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
          >
            Добавить задачу
          </button>
        </div>
      )}
    </div>
  );
}
