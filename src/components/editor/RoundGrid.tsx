import { useState } from 'react';
import { Clue, Round } from '../../types';
import { addCategory, removeCategory, updateCategory, updateClue } from '../../lib/round';
import ClueEditModal from './ClueEditModal';

const MEDIA_ICON: Record<string, string> = {
  image: '🖼️',
  audio: '🔊',
  video: '🎬',
};

interface Props {
  round: Round;
  onChange: (round: Round) => void;
}

export default function RoundGrid({ round, onChange }: Props) {
  const [editing, setEditing] = useState<{ categoryId: string; clueId: string } | null>(null);

  function handleAddCategory() {
    if (round.categories.length >= 8) return;
    onChange(addCategory(round));
  }

  function handleRemoveCategory(categoryId: string) {
    if (round.categories.length <= 1) return;
    if (!confirm('Remove this category and its clues?')) return;
    onChange(removeCategory(round, categoryId));
  }

  function handleSaveClue(categoryId: string, clue: Clue) {
    onChange(updateCategory(round, categoryId, (c) => updateClue(c, clue.id, () => clue)));
    setEditing(null);
  }

  const editingCategory = editing ? round.categories.find((c) => c.id === editing.categoryId) : null;
  const editingClue = editingCategory?.clues.find((cl) => cl.id === editing?.clueId);

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="inline-grid gap-2"
        style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(170px, 1fr)) auto` }}
      >
        {round.categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-1 rounded-md bg-board px-2 py-2">
            <input
              value={cat.name}
              onChange={(e) => onChange(updateCategory(round, cat.id, (c) => ({ ...c, name: e.target.value })))}
              placeholder="Category"
              className="w-full bg-transparent text-center text-sm font-bold uppercase tracking-wide text-white placeholder-slate-300 focus:outline-none"
            />
            <button
              onClick={() => handleRemoveCategory(cat.id)}
              disabled={round.categories.length <= 1}
              title="Remove category"
              className="shrink-0 text-slate-300 hover:text-red-300 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={handleAddCategory}
          disabled={round.categories.length >= 8}
          style={{ gridRow: `1 / span ${round.values.length + 1}` }}
          className="min-h-[44px] rounded-md border border-dashed border-slate-700 px-3 text-sm text-slate-400 hover:border-gold hover:text-gold disabled:opacity-30"
        >
          + Category
        </button>

        {round.values.map((value, rowIdx) =>
          round.categories.map((cat) => {
            const clue = cat.clues[rowIdx];
            const filled = clue.prompt.trim().length > 0;
            return (
              <button
                key={clue.id}
                onClick={() => setEditing({ categoryId: cat.id, clueId: clue.id })}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-center transition ${
                  filled
                    ? 'border-board bg-board-darker hover:border-gold'
                    : 'border-dashed border-slate-700 bg-slate-900 hover:border-slate-500'
                }`}
              >
                <span className="font-display text-lg text-gold">${value}</span>
                {clue.media && <span className="text-xs">{MEDIA_ICON[clue.media.type]}</span>}
                <span className="line-clamp-2 text-xs text-slate-400">
                  {filled ? clue.prompt : 'Click to add clue'}
                </span>
              </button>
            );
          }),
        )}
      </div>

      {editingCategory && editingClue && (
        <ClueEditModal
          clue={editingClue}
          categoryName={editingCategory.name}
          onClose={() => setEditing(null)}
          onSave={(clue) => handleSaveClue(editingCategory.id, clue)}
        />
      )}
    </div>
  );
}
