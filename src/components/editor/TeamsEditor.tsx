import { Team } from '../../types';
import { makeTeam } from '../../lib/round';

interface Props {
  teams: Team[];
  onChange: (teams: Team[]) => void;
}

export default function TeamsEditor({ teams, onChange }: Props) {
  function updateTeam(id: string, patch: Partial<Team>) {
    onChange(teams.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTeam() {
    if (teams.length >= 8) return;
    onChange([...teams, makeTeam(`Team ${teams.length + 1}`, teams.length)]);
  }

  function removeTeam(id: string) {
    if (teams.length <= 1) return;
    onChange(teams.filter((t) => t.id !== id));
  }

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm text-slate-400">
        Set up the teams or players who will compete. Scores start fresh each time you begin a
        match from the Host screen.
      </p>
      <ul className="space-y-3">
        {teams.map((team) => (
          <li key={team.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
            <input
              type="color"
              value={team.color}
              onChange={(e) => updateTeam(team.id, { color: e.target.value })}
              className="h-10 w-10 shrink-0 cursor-pointer rounded border border-slate-700 bg-transparent"
            />
            <input
              value={team.name}
              onChange={(e) => updateTeam(team.id, { name: e.target.value })}
              className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:border-gold focus:outline-none"
            />
            <button
              onClick={() => removeTeam(team.id)}
              disabled={teams.length <= 1}
              className="text-slate-400 hover:text-red-300 disabled:opacity-30"
              title="Remove team"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={addTeam}
        disabled={teams.length >= 8}
        className="mt-4 rounded-md border border-dashed border-slate-700 px-4 py-2 text-sm text-slate-400 hover:border-gold hover:text-gold disabled:opacity-30"
      >
        + Add Team
      </button>
    </div>
  );
}
