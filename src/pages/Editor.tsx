import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Game, RoundId } from '../types';
import { loadGame, saveGame } from '../lib/db';
import { updateRound } from '../lib/round';
import { exportGame } from '../lib/portability';
import RoundGrid from '../components/editor/RoundGrid';
import TeamsEditor from '../components/editor/TeamsEditor';

type Tab = RoundId | 'teams';

export default function Editor() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('round1');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!gameId) return;
    loadGame(gameId).then((g) => {
      if (!g) {
        setNotFound(true);
        return;
      }
      setGame(g);
    });
  }, [gameId]);

  useEffect(() => {
    if (!game) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveGame(game);
      setSaveStatus('saved');
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="mb-4 text-lg">Game not found.</p>
        <Link to="/" className="text-gold underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!game) {
    return <div className="p-10 text-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white">
            ←
          </Link>
          <input
            value={game.title}
            onChange={(e) => setGame({ ...game, title: e.target.value })}
            className="border-b border-transparent bg-transparent font-display text-2xl text-gold focus:border-gold focus:outline-none"
          />
          <span className="text-xs text-slate-500">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportGame(game)}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Export
          </button>
          <button
            onClick={() => navigate(`/host/${game.id}`)}
            className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold hover:bg-emerald-500"
          >
            Play This Game
          </button>
        </div>
      </header>

      <nav className="mb-6 flex gap-2 border-b border-slate-800">
        {(
          [
            { id: 'round1' as const, label: game.round1.name },
            { id: 'round2' as const, label: game.round2.name },
            { id: 'teams' as const, label: 'Teams' },
          ] satisfies { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t.id ? 'border-gold text-gold' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'round1' && (
        <RoundGrid round={game.round1} onChange={(round1) => setGame(updateRound(game, 'round1', () => round1))} />
      )}
      {tab === 'round2' && (
        <RoundGrid round={game.round2} onChange={(round2) => setGame(updateRound(game, 'round2', () => round2))} />
      )}
      {tab === 'teams' && <TeamsEditor teams={game.teams} onChange={(teams) => setGame({ ...game, teams })} />}
    </div>
  );
}
