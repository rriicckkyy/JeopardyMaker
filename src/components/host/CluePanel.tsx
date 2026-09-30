import { Category, Clue } from '../../types';
import { RevealStage } from '../../lib/liveChannel';

interface Props {
  category: Category;
  clue: Clue;
  stage: RevealStage;
  wager: { teamName: string; amount: number } | null;
  onRevealAnswer: () => void;
  onCloseNoScore: () => void;
}

export default function CluePanel({ category, clue, stage, wager, onRevealAnswer, onCloseNoScore }: Props) {
  return (
    <div className="rounded-lg border border-gold/40 bg-slate-900 p-5">
      {wager && (
        <p className="mb-2 inline-block rounded-md bg-gold/20 px-2 py-1 text-sm font-semibold text-gold">
          ⭐ {wager.teamName} wagered ${wager.amount}
        </p>
      )}
      <p className="mb-1 text-sm uppercase tracking-wide text-slate-400">
        {category.name} · ${clue.value}
      </p>
      <p className="mb-3 text-lg font-semibold">
        {clue.prompt || <em className="text-slate-500">No clue text set</em>}
      </p>
      <p className="mb-4 text-emerald-400">
        Answer: {clue.answer || <em className="text-slate-500">not set</em>}
      </p>
      {clue.media && <p className="mb-4 text-xs text-slate-500">Media attached: {clue.media.fileName}</p>}

      <div className="flex flex-wrap gap-2">
        {stage === 'question' && (
          <button
            onClick={onRevealAnswer}
            className="rounded-md bg-board px-4 py-2 text-sm font-semibold hover:bg-board-dark"
          >
            Reveal Answer on Board
          </button>
        )}
        <button
          onClick={onCloseNoScore}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          No one got it — return to board
        </button>
      </div>
    </div>
  );
}
