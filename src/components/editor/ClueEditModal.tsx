import { useState } from 'react';
import { Clue, ClueMedia } from '../../types';
import { deleteMedia, saveMedia } from '../../lib/db';
import { makeId } from '../../lib/id';
import MediaDropzone, { mediaTypeFromMime } from './MediaDropzone';

interface Props {
  clue: Clue;
  categoryName: string;
  onClose: () => void;
  onSave: (clue: Clue) => void;
}

export default function ClueEditModal({ clue, categoryName, onClose, onSave }: Props) {
  const [prompt, setPrompt] = useState(clue.prompt);
  const [answer, setAnswer] = useState(clue.answer);
  const [keepMedia, setKeepMedia] = useState<ClueMedia | null>(clue.media);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      let finalMedia: ClueMedia | null = keepMedia;

      if (pendingFile) {
        if (clue.media) await deleteMedia(clue.media.id);
        const id = makeId('media');
        await saveMedia(id, pendingFile);
        finalMedia = {
          id,
          type: mediaTypeFromMime(pendingFile.type)!,
          fileName: pendingFile.name,
          mimeType: pendingFile.type,
        };
      } else if (!keepMedia && clue.media) {
        await deleteMedia(clue.media.id);
        finalMedia = null;
      }

      onSave({ ...clue, prompt, answer, media: finalMedia });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gold">
            {categoryName || 'Category'} · ${clue.value}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <label className="mb-1 block text-sm text-slate-400">Clue (shown to players)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mb-4 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:border-gold focus:outline-none"
          placeholder="e.g. This planet is known as the Red Planet"
        />

        <label className="mb-1 block text-sm text-slate-400">Correct response (host only)</label>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:border-gold focus:outline-none"
          placeholder="e.g. What is Mars?"
        />

        <label className="mb-1 block text-sm text-slate-400">Media (optional)</label>
        <MediaDropzone
          existingMedia={keepMedia}
          pendingFile={pendingFile}
          onSelectFile={(file) => {
            setPendingFile(file);
            setKeepMedia(null);
          }}
          onRemove={() => {
            setPendingFile(null);
            setKeepMedia(null);
          }}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-board px-5 py-2 font-semibold hover:bg-board-dark disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Clue'}
          </button>
        </div>
      </div>
    </div>
  );
}
