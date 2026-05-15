import { Game, Player, Team } from '@/data/store';
import Icon from '@/components/ui/icon';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = ['#E53935', '#1E88E5', '#43A047', '#F5A623', '#8E24AA', '#00ACC1', '#FF6F00'];
  return colors[parseInt(id) % colors.length];
}

interface GameCardTeamsProps {
  game: Game;
  players: Player[];
  gamePlayers: Player[];
  isAdmin: boolean;
  assignTarget: { gameId: string; teamId: string } | null;
  onDeclareWinner: (gameId: string, winnerTeamId: string) => void;
  onAssignPlayerToTeam: (gameId: string, teamId: string, playerId: string) => void;
  onRemovePlayerFromGame: (gameId: string, playerId: string) => void;
  onSetAssignTarget: (target: { gameId: string; teamId: string } | null) => void;
  getPlayerInTeam: (game: Game, playerId: string) => Team | undefined;
}

export default function GameCardTeams({
  game, players, gamePlayers, isAdmin, assignTarget,
  onDeclareWinner, onAssignPlayerToTeam, onRemovePlayerFromGame,
  onSetAssignTarget, getPlayerInTeam,
}: GameCardTeamsProps) {
  const unassigned = gamePlayers.filter(p => !getPlayerInTeam(game, p.id));

  return (
    <>
      {/* Teams */}
      {game.teams.length > 0 && (
        <div>
          <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-2">
            Команды
          </div>
          <div className="space-y-2">
            {game.teams.map(team => {
              const teamPlayers = players.filter(p => team.playerIds.includes(p.id));
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
                    {isAdmin && game.status !== 'finished' && unassigned.length > 0 && (
                      <button
                        onClick={() => onSetAssignTarget(assignTarget?.teamId === team.id ? null : { gameId: game.id, teamId: team.id })}
                        className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground"
                        style={{ border: '1px dashed hsl(var(--border))' }}
                      >
                        + игрок
                      </button>
                    )}
                  </div>
                  {assignTarget?.teamId === team.id && isAdmin && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {gamePlayers.filter(p => !getPlayerInTeam(game, p.id)).map(p => (
                        <button
                          key={p.id}
                          onClick={() => { onAssignPlayerToTeam(game.id, team.id, p.id); onSetAssignTarget(null); }}
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
      {unassigned.length > 0 && (
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
      )}
    </>
  );
}
