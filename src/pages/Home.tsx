import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameSummary } from '../types';
import { listGameSummaries, loadGame, saveGame } from '../lib/db';
import { createBlankGame } from '../lib/round';
import { deleteGameCompletely, duplicateGame } from '../lib/gameOps';
import { exportGame, importGameFromFile } from '../lib/portability';

export default function Home() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function refresh() {
    setGames(await listGameSummaries());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleNewGame() {
    const game = createBlankGame('New Game');
    await saveGame(game);
    navigate(`/edit/${game.id}`);
  }

  async function handleDuplicate(id: string) {
    setBusy(true);
    try {
      const game = await loadGame(id);
      if (!game) return;
      await duplicateGame(game);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const game = await loadGame(id);
      if (game) await deleteGameCompletely(game);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(id: string) {
    const game = await loadGame(id);
    if (game) await exportGame(game);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const game = await importGameFromFile(file);
      navigate(`/edit/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import game.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-gold">JeopardyMaker</h1>
          <p className="mt-1 text-slate-400">
            Build a Jeopardy-style board, then present it on your TV. Everything stays on this
            computer.
          </p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={handleNewGame}
          disabled={busy}
          className="rounded-lg bg-board px-5 py-3 font-semibold shadow hover:bg-board-dark disabled:opacity-50"
        >
          + New Game
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          Import Game (.json)
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {games.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-6 py-10 text-center text-slate-500">
          No games yet. Create one to get started.
        </p>
      ) : (
        <ul className="space-y-3">
          {games.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-5 py-4"
            >
              <div>
                <p className="text-lg font-semibold">{g.title}</p>
                <p className="text-sm text-slate-500">
                  Updated {new Date(g.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  onClick={() => navigate(`/host/${g.id}`)}
                  className="rounded-md bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500"
                >
                  Play
                </button>
                <button
                  onClick={() => navigate(`/edit/${g.id}`)}
                  className="rounded-md bg-slate-700 px-3 py-2 font-semibold hover:bg-slate-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(g.id)}
                  className="rounded-md border border-slate-700 px-3 py-2 hover:bg-slate-800"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleExport(g.id)}
                  className="rounded-md border border-slate-700 px-3 py-2 hover:bg-slate-800"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(g.id, g.title)}
                  className="rounded-md border border-red-800 px-3 py-2 text-red-300 hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
