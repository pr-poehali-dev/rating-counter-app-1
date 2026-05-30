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

/**
 * Вычисляет очки для каждого места по правилу:
 * - 1-е место: +100 за каждую проигравшую команду
 * - 2-е место: -100 (за 1-е место)
 * - 3-е место: -100 (за 1-е) -100 (за 2-е) = -200
 * - N-е место: -(N-1)*100
 * Итого 1-е место получает (N-1)*100, остальные минус по нарастающей.
 */
function calcPoints(placements: string[]): Record<string, number> {
  const n = placements.length;
  const result: Record<string, number> = {};
  placements.forEach((teamId, idx) => {
    if (idx === 0) {
      // 1-е место: +100 за каждую проигравшую команду
      result[teamId] = (n - 1) * 100;
    } else {
      // idx-е место: теряет по 100 за каждое место выше себя
      result[teamId] = -idx * 100;
    }
  });
  return result;
}

export default function FinishGameModal({ game, onFinish, onCancel }: FinishGameModalProps) {
  // placements — массив teamId в порядке занятых мест
  const [placements, setPlacements] = useState<(string | null)[]>(
    game.teams.map((_, i) => game.teams[i]?.id ?? null)
  );

  const teamsCount = game.teams.length;
  const allAssigned = placements.every(p => p !== null) && new Set(placements).size === teamsCount;
  const pointsPreview = allAssigned ? calcPoints(placements as string[]) : null;

  function setPlace(place: number, teamId: string) {
    setPlacements(prev => {
      const next = [...prev];
      // Если эта команда уже стоит на другом месте — убираем
      const oldPlace = next.findIndex(id => id === teamId);
      if (oldPlace !== -1 && oldPlace !== place) next[oldPlace] = null;
      // Если на этом месте уже другая команда — убираем её
      const displaced = next[place];
      if (displaced && displaced !== teamId) {
        const freeSlot = next.findIndex(id => id === null);
        if (freeSlot !== -1) next[freeSlot] = displaced;
      }
      next[place] = teamId;
      return next;
    });
  }

  function getTeamById(id: string): Team | undefined {
    return game.teams.find(t => t.id === id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-lg rounded-t-2xl p-5 space-y-4 animate-slide-up"
        style={{ background: 'hsl(220 14% 11%)', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-montserrat font-800 text-base text-foreground">Завершить игру</div>
            <div className="text-xs text-muted-foreground mt-0.5">Расставьте команды по местам</div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Places */}
        <div className="space-y-2">
          {Array.from({ length: teamsCount }).map((_, placeIdx) => {
            const assignedTeamId = placements[placeIdx];
            const assignedTeam = assignedTeamId ? getTeamById(assignedTeamId) : null;
            const pts = pointsPreview?.[assignedTeamId ?? ''];

            return (
              <div key={placeIdx} className="rounded-lg p-3"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-montserrat font-700 text-sm text-foreground">
                    {PLACE_LABELS[placeIdx] ?? `${placeIdx + 1}-е место`}
                  </span>
                  {pts !== undefined && (
                    <span className="text-xs font-montserrat font-700"
                      style={{ color: pts >= 0 ? '#4CAF50' : '#E53935' }}>
                      {pts >= 0 ? `+${pts}` : pts} очков
                    </span>
                  )}
                </div>

                {/* Assigned team */}
                {assignedTeam ? (
                  <div className="flex items-center justify-between rounded-md px-3 py-2"
                    style={{ background: `${assignedTeam.color}18`, border: `1px solid ${assignedTeam.color}50` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: assignedTeam.color }} />
                      <span className="text-sm font-montserrat font-600" style={{ color: assignedTeam.color }}>
                        {assignedTeam.name}
                      </span>
                      <span className="text-xs text-muted-foreground">({assignedTeam.playerIds.length} игр.)</span>
                    </div>
                    <button onClick={() => setPlacements(prev => { const n = [...prev]; n[placeIdx] = null; return n; })}
                      className="text-muted-foreground hover:text-red-400">
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ) : (
                  /* Team picker */
                  <div className="flex flex-wrap gap-1.5">
                    {game.teams.filter(t => !placements.includes(t.id)).map(team => (
                      <button key={team.id}
                        onClick={() => setPlace(placeIdx, team.id)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md"
                        style={{ background: `${team.color}15`, color: team.color, border: `1px solid ${team.color}40` }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: team.color }} />
                        {team.name}
                      </button>
                    ))}
                    {game.teams.filter(t => !placements.includes(t.id)).length === 0 && (
                      <span className="text-xs text-muted-foreground">Все команды распределены</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Points summary */}
        {allAssigned && pointsPreview && (
          <div className="rounded-lg p-3 space-y-1.5"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
            <div className="text-xs font-montserrat font-700 uppercase tracking-wider text-muted-foreground mb-2">
              Итог по очкам
            </div>
            {(placements as string[]).map((teamId, idx) => {
              const team = getTeamById(teamId);
              const pts = pointsPreview[teamId];
              if (!team) return null;
              return (
                <div key={teamId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{PLACE_MEDALS[idx]}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: team.color }} />
                    <span className="text-foreground">{team.name}</span>
                  </div>
                  <span className="font-montserrat font-700" style={{ color: pts >= 0 ? '#4CAF50' : '#E53935' }}>
                    {pts >= 0 ? `+${pts}` : pts}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm */}
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-montserrat font-600 text-muted-foreground"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
            Отмена
          </button>
          <button
            onClick={() => allAssigned && onFinish(game.id, placements as string[])}
            disabled={!allAssigned}
            className="flex-1 py-2.5 rounded-lg text-sm font-montserrat font-700 disabled:opacity-40"
            style={{ background: allAssigned ? '#4CAF50' : 'hsl(var(--muted))', color: allAssigned ? '#fff' : 'hsl(var(--muted-foreground))' }}>
            Завершить игру
          </button>
        </div>
      </div>
    </div>
  );
}
