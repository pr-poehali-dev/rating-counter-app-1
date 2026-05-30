import { useState } from 'react';
import { Game, Team } from '@/data/store';
import Icon from '@/components/ui/icon';

const PLACE_LABELS = ['🥇 1-е место', '🥈 2-е место', '🥉 3-е место', '4-е место', '5-е место', '6-е место'];
const PLACE_MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];

interface FinishGameModalProps {
  game: Game;
  onFinish: (gameId: string, placements: string[]) => void;
  onCancel: () => void;
}

function calcPoints(placements: string[]): Record<string, number> {
  const n = placements.length;
  const result: Record<string, number> = {};
  placements.forEach((teamId, idx) => {
    result[teamId] = idx === 0 ? (n - 1) * 100 : -idx * 100;
  });
  return result;
}

export default function FinishGameModal({ game, onFinish, onCancel }: FinishGameModalProps) {
  // Начинаем с пустых слотов — каждое место пусто
  const [placements, setPlacements] = useState<(string | null)[]>(
    Array(game.teams.length).fill(null)
  );

  const teamsCount = game.teams.length;
  const filledCount = placements.filter(Boolean).length;
  const allAssigned = filledCount === teamsCount && new Set(placements).size === teamsCount;
  const pointsPreview = allAssigned ? calcPoints(placements as string[]) : null;

  function getTeamById(id: string): Team | undefined {
    return game.teams.find(t => t.id === id);
  }

  // Назначить команду на место
  function assignTeam(placeIdx: number, teamId: string) {
    setPlacements(prev => {
      const next = [...prev];
      // Убираем эту команду с другого места если уже стоит
      const oldPlace = next.findIndex(id => id === teamId);
      if (oldPlace !== -1) next[oldPlace] = null;
      next[placeIdx] = teamId;
      return next;
    });
  }

  // Убрать команду с места
  function removeTeam(placeIdx: number) {
    setPlacements(prev => {
      const next = [...prev];
      next[placeIdx] = null;
      return next;
    });
  }

  // Команды, ещё не назначенные ни на одно место
  const unassignedTeams = game.teams.filter(t => !placements.includes(t.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl animate-slide-up overflow-hidden"
        style={{ background: 'hsl(220 14% 11%)', border: '1px solid hsl(var(--border))', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="font-montserrat font-800 text-base text-foreground">Завершить игру</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Назначьте команду на каждое место ({filledCount}/{teamsCount})
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-5 space-y-3" style={{ maxHeight: 'calc(90vh - 140px)' }}>

          {/* Places list */}
          {Array.from({ length: teamsCount }).map((_, placeIdx) => {
            const assignedTeamId = placements[placeIdx];
            const assignedTeam = assignedTeamId ? getTeamById(assignedTeamId) : null;
            const pts = pointsPreview?.[assignedTeamId ?? ''];
            const isFirst = placeIdx === 0;

            return (
              <div
                key={placeIdx}
                className="rounded-xl overflow-hidden"
                style={{
                  border: assignedTeam
                    ? `1px solid ${assignedTeam.color}50`
                    : '1px solid hsl(var(--border))',
                  background: assignedTeam ? `${assignedTeam.color}0d` : 'hsl(var(--card))',
                }}
              >
                {/* Place label row */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">
                      {PLACE_MEDALS[placeIdx] ?? `${placeIdx + 1}`}
                    </span>
                    <span className="font-montserrat font-700 text-sm text-foreground">
                      {PLACE_LABELS[placeIdx] ?? `${placeIdx + 1}-е место`}
                    </span>
                  </div>
                  {assignedTeamId && pts !== undefined && (
                    <span
                      className="font-montserrat font-700 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: pts >= 0 ? 'rgba(76,175,80,0.15)' : 'rgba(229,57,53,0.15)',
                        color: pts >= 0 ? '#4CAF50' : '#E53935',
                      }}
                    >
                      {pts >= 0 ? `+${pts}` : pts} очков
                    </span>
                  )}
                </div>

                {/* Assigned team */}
                {assignedTeam ? (
                  <div
                    className="flex items-center justify-between mx-3 mb-3 rounded-lg px-3 py-2"
                    style={{ background: `${assignedTeam.color}18`, border: `1px solid ${assignedTeam.color}40` }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: assignedTeam.color }} />
                      <span className="font-montserrat font-600 text-sm" style={{ color: assignedTeam.color }}>
                        {assignedTeam.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {assignedTeam.playerIds.length} игр.
                      </span>
                    </div>
                    <button
                      onClick={() => removeTeam(placeIdx)}
                      className="text-muted-foreground hover:text-red-400 transition-colors ml-2"
                    >
                      <Icon name="X" size={15} />
                    </button>
                  </div>
                ) : (
                  /* Team picker */
                  <div className="px-3 pb-3">
                    {unassignedTeams.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">Все команды уже назначены</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {unassignedTeams.map(team => (
                          <button
                            key={team.id}
                            onClick={() => assignTeam(placeIdx, team.id)}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-600 transition-opacity hover:opacity-80"
                            style={{
                              background: `${team.color}18`,
                              color: team.color,
                              border: `1px solid ${team.color}50`,
                            }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: team.color }} />
                            {team.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          {allAssigned && pointsPreview && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
            >
              <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-1">
                Итоговые очки
              </div>
              {(placements as string[]).map((teamId, idx) => {
                const team = getTeamById(teamId);
                const pts = pointsPreview[teamId];
                if (!team) return null;
                return (
                  <div key={teamId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center">{PLACE_MEDALS[idx]}</span>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: team.color }} />
                      <span className="text-foreground font-montserrat font-600">{team.name}</span>
                    </div>
                    <span
                      className="font-montserrat font-700 text-sm"
                      style={{ color: pts >= 0 ? '#4CAF50' : '#E53935' }}
                    >
                      {pts >= 0 ? `+${pts}` : pts}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div
          className="flex gap-3 px-5 py-4"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
        >
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-montserrat font-600 text-muted-foreground transition-colors"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
          >
            Отмена
          </button>
          <button
            onClick={() => allAssigned && onFinish(game.id, placements as string[])}
            disabled={!allAssigned}
            className="flex-1 py-3 rounded-xl text-sm font-montserrat font-700 transition-all disabled:opacity-40"
            style={{
              background: allAssigned ? '#4CAF50' : 'hsl(var(--muted))',
              color: allAssigned ? '#fff' : 'hsl(var(--muted-foreground))',
            }}
          >
            {allAssigned ? '✓ Завершить игру' : `Назначьте все места (${filledCount}/${teamsCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
