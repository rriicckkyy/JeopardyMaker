import { useState } from 'react';
import { TeamScore } from '../../lib/liveChannel';

interface Props {
  teams: TeamScore[];
  roundMaxValue: number;
  onConfirm: (teamId: string, amount: number) => void;
  onCancel: () => void;
}

export default function WagerPanel({ teams, roundMaxValue, onConfirm, onCancel }: Props) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const selectedTeam = teams.find((t) => t.id === teamId) ?? null;
  const suggestedMax = selectedTeam ? Math.max(selectedTeam.score, roundMaxValue) : roundMaxValue;

  function handleConfirm() {
    if (!teamId) return;
    const parsed = parseInt(amount, 10);
    onConfirm(teamId, Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
  }

  return (
    <div className="rounded-lg border-2 border-gold bg-slate-900 p-5">
      <p className="mb-1 font-display text-xl text-gold">⭐ Wager Clue!</p>
      <p className="mb-4 text-sm text-slate-400">
        Pick who's wagering and how much, then reveal the clue.
      </p>

      <p className="mb-2 text-sm text-slate-400">Wagering team</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => setTeamId(t.id)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
              teamId === t.id ? 'border-gold bg-board' : 'border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
            {t.name} <span className="text-slate-400">({t.score})</span>
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm text-slate-400">
        Wager amount
        {selectedTeam && <span className="text-slate-500"> — suggested max: ${suggestedMax}</span>}
      </p>
      <input
        type="number"
        min={0}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g. 500"
        className="mb-4 w-full max-w-[180px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:border-gold focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleConfirm}
          disabled={!teamId || amount.trim() === ''}
          className="rounded-md bg-board px-5 py-2 text-sm font-semibold hover:bg-board-dark disabled:opacity-40"
        >
          Confirm Wager & Reveal Clue
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Cancel — return to board
        </button>
      </div>
    </div>
  );
}
