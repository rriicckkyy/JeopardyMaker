import { Round } from '../../types';

interface Props {
  round: Round;
  answeredClueIds: string[];
}

export default function BoardGrid({ round, answeredClueIds }: Props) {
  return (
    <div
      className="grid flex-1 gap-3"
      style={{ gridTemplateColumns: `repeat(${round.categories.length}, 1fr)`, gridTemplateRows: `auto repeat(${round.values.length}, 1fr)` }}
    >
      {round.categories.map((cat) => (
        <div key={cat.id} className="flex items-center justify-center rounded-lg bg-board px-2 py-4 text-center">
          <span className="font-display text-base uppercase leading-tight tracking-wide text-white md:text-xl">
            {cat.name || '—'}
          </span>
        </div>
      ))}

      {round.values.map((value, rowIdx) =>
        round.categories.map((cat) => {
          const clue = cat.clues[rowIdx];
          const answered = answeredClueIds.includes(clue.id);
          return (
            <div
              key={clue.id}
              className={`flex items-center justify-center rounded-lg ${answered ? 'bg-slate-900/60' : 'bg-board-dark'}`}
            >
              {!answered && (
                <span className="font-display text-3xl text-gold md:text-5xl">${value}</span>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
