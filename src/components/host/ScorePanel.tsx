import { useState } from 'react';
import { TeamScore } from '../../lib/liveChannel';
import { useHostLive } from '../../store/useHostLive';

function TeamCard({ team }: { team: TeamScore }) {
  const activeClue = useHostLive((s) => s.live?.activeClue ?? null);
  const awardAndClose = useHostLive((s) => s.awardAndClose);
  const penalizeKeepOpen = useHostLive((s) => s.penalizeKeepOpen);
  const adjustScore = useHostLive((s) => s.adjustScore);
  const setScore = useHostLive((s) => s.setScore);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(team.score));

  function commit() {
    const value = parseInt(draft, 10);
    if (!Number.isNaN(value)) setScore(team.id, value);
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
        <span className="truncate font-semibold">{team.name}</span>
      </div>

      {editing ? (
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="mb-3 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xl"
        />
      ) : (
        <button
          onClick={() => {
            setDraft(String(team.score));
            setEditing(true);
          }}
          title="Click to edit score directly"
          className="mb-3 block font-display text-3xl text-gold hover:underline"
        >
          {team.score}
        </button>
      )}

      {activeClue ? (
        <div className="flex gap-2">
          <button
            onClick={() => awardAndClose(team.id, activeClue.value)}
            className="flex-1 rounded-md bg-emerald-600 py-2 text-sm font-semibold hover:bg-emerald-500"
          >
            ✓ +{activeClue.value}
          </button>
          <button
            onClick={() => penalizeKeepOpen(team.id, -activeClue.value)}
            className="flex-1 rounded-md bg-red-700 py-2 text-sm font-semibold hover:bg-red-600"
          >
            ✗ −{activeClue.value}
          </button>
        </div>
      ) : (
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => adjustScore(team.id, -100)}
            className="flex-1 rounded-md border border-slate-700 py-1 hover:bg-slate-800"
          >
            −100
          </button>
          <button
            onClick={() => adjustScore(team.id, 100)}
            className="flex-1 rounded-md border border-slate-700 py-1 hover:bg-slate-800"
          >
            +100
          </button>
        </div>
      )}
    </div>
  );
}

export default function ScorePanel() {
  const teams = useHostLive((s) => s.live?.teams ?? []);
  return (
    <div className="space-y-3">
      {teams.map((t) => (
        <TeamCard key={t.id} team={t} />
      ))}
    </div>
  );
}
