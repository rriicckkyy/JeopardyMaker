import { useEffect, useRef, useState } from 'react';
import { Clue, Round } from '../../types';
import { addCategory, ClueRef, removeCategory, swapClueContent, updateCategory, updateClue } from '../../lib/round';
import ClueEditModal from './ClueEditModal';

const MEDIA_ICON: Record<string, string> = {
  image: '🖼️',
  audio: '🔊',
  video: '🎬',
};

const DRAG_THRESHOLD = 6;

interface DragState {
  source: ClueRef;
  label: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  hoverTarget: ClueRef | null;
}

interface Props {
  round: Round;
  onChange: (round: Round) => void;
}

export default function RoundGrid({ round, onChange }: Props) {
  const [editing, setEditing] = useState<{ categoryId: string; clueId: string } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Always-up-to-date refs so the mount-once mouse listeners never see stale props.
  const roundRef = useRef(round);
  roundRef.current = round;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (!d.active && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD) {
        d.active = true;
        document.body.style.userSelect = 'none';
      }
      d.x = e.clientX;
      d.y = e.clientY;
      if (d.active) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const cellEl = el?.closest('[data-clue-cell]') as HTMLElement | null;
        d.hoverTarget = cellEl
          ? { categoryId: cellEl.dataset.categoryId!, clueId: cellEl.dataset.clueId! }
          : null;
      }
      setDrag({ ...d });
    }

    function onUp() {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      document.body.style.userSelect = '';
      if (d?.active && d.hoverTarget) {
        onChangeRef.current(swapClueContent(roundRef.current, d.source, d.hoverTarget));
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };
  }, []);

  function handleCellMouseDown(e: React.MouseEvent, source: ClueRef, label: string) {
    if (e.button !== 0) return;
    dragRef.current = {
      source,
      label,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      hoverTarget: null,
    };
  }

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
      <p className="mb-3 text-xs text-slate-500">Drag a clue onto another slot to swap them — the point value always matches the slot, not the clue.</p>
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
            const isSource = drag?.active && drag.source.categoryId === cat.id && drag.source.clueId === clue.id;
            const isHoverTarget =
              drag?.active &&
              !isSource &&
              drag.hoverTarget?.categoryId === cat.id &&
              drag.hoverTarget?.clueId === clue.id;
            return (
              <button
                key={clue.id}
                data-clue-cell
                data-category-id={cat.id}
                data-clue-id={clue.id}
                onMouseDown={(e) => handleCellMouseDown(e, { categoryId: cat.id, clueId: clue.id }, `$${value}`)}
                onClick={() => setEditing({ categoryId: cat.id, clueId: clue.id })}
                className={`flex min-h-[72px] cursor-grab flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-center transition active:cursor-grabbing ${
                  isHoverTarget
                    ? 'border-gold ring-2 ring-gold'
                    : filled
                      ? 'border-board bg-board-darker hover:border-gold'
                      : 'border-dashed border-slate-700 bg-slate-900 hover:border-slate-500'
                } ${isSource ? 'opacity-30' : ''}`}
              >
                <span className="relative font-display text-lg text-gold">
                  ${value}
                  {clue.isWager && (
                    <span className="absolute -right-3 -top-1 text-xs" title="Wager clue">
                      ⭐
                    </span>
                  )}
                </span>
                {clue.media && <span className="text-xs">{MEDIA_ICON[clue.media.type]}</span>}
                <span className="line-clamp-2 text-xs text-slate-400">
                  {filled ? clue.prompt : 'Click to add clue'}
                </span>
              </button>
            );
          }),
        )}
      </div>

      {drag?.active && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gold bg-slate-900 px-3 py-2 text-sm font-semibold text-gold shadow-xl"
          style={{ left: drag.x, top: drag.y }}
        >
          Moving {drag.label} clue
        </div>
      )}

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
