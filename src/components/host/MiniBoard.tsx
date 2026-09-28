import { Clue, Round } from '../../types';

interface Props {
  round: Round;
  answeredClueIds: string[];
  activeClueId: string | null;
  locked: boolean;
  onOpenClue: (categoryId: string, clue: Clue) => void;
}

export default function MiniBoard({ round, answeredClueIds, activeClueId, locked, onOpenClue }: Props) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${round.categories.length}, 1fr)` }}>
      {round.categories.map((cat) => (
        <div
          key={cat.id}
          className="truncate rounded bg-board px-2 py-2 text-center text-xs font-bold uppercase text-white"
          title={cat.name}
        >
          {cat.name || '—'}
        </div>
      ))}

      {round.values.map((value, rowIdx) =>
        round.categories.map((cat) => {
          const clue = cat.clues[rowIdx];
          const answered = answeredClueIds.includes(clue.id);
          const active = clue.id === activeClueId;
          return (
            <button
              key={clue.id}
              disabled={answered || (locked && !active)}
              onClick={() => onOpenClue(cat.id, clue)}
              className={`rounded py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-gold text-board-darker'
                  : answered
                    ? 'cursor-default bg-slate-900 text-slate-700'
                    : 'bg-board-dark hover:bg-board disabled:opacity-40'
              }`}
            >
              {answered ? '' : `$${value}`}
            </button>
          );
        }),
      )}
    </div>
  );
}
