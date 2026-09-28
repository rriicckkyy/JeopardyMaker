import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Game } from '../types';
import { loadGame } from '../lib/db';
import { useHostLive } from '../store/useHostLive';
import MiniBoard from '../components/host/MiniBoard';
import CluePanel from '../components/host/CluePanel';
import ScorePanel from '../components/host/ScorePanel';

export default function Host() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const live = useHostLive((s) => s.live);
  const init = useHostLive((s) => s.init);
  const teardown = useHostLive((s) => s.teardown);
  const resetMatch = useHostLive((s) => s.resetMatch);
  const setRound = useHostLive((s) => s.setRound);
  const openClue = useHostLive((s) => s.openClue);
  const revealAnswer = useHostLive((s) => s.revealAnswer);
  const closeWithoutScoring = useHostLive((s) => s.closeWithoutScoring);

  useEffect(() => {
    if (!gameId) return;
    loadGame(gameId).then((g) => {
      if (g) {
        setGame(g);
        init(g);
      }
    });
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  function openBoardWindow() {
    if (!gameId) return;
    window.open(`/board/${gameId}`, 'jeopardy-board', 'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no');
  }

  if (!game || !live) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  const round = live.currentRound === 'round1' ? game.round1 : game.round2;
  const activeCategory = live.activeClue ? round.categories.find((c) => c.id === live.activeClue!.categoryId) : null;
  const activeClueObj = activeCategory?.clues.find((c) => c.id === live.activeClue!.clueId);
  const roundClueCount = round.categories.reduce((n, c) => n + c.clues.length, 0);
  const roundComplete = round.categories.length > 0 && live.answeredClueIds.filter((id) => round.categories.some((c) => c.clues.some((cl) => cl.id === id))).length >= roundClueCount;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white">
            ←
          </Link>
          <h1 className="font-display text-2xl text-gold">{game.title}</h1>
          <Link to={`/edit/${game.id}`} className="text-sm text-slate-400 underline hover:text-white">
            Edit game
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBoardWindow}
            className="rounded-md bg-board px-4 py-2 text-sm font-semibold hover:bg-board-dark"
          >
            Open Board Display
          </button>
          <button
            onClick={() => {
              if (confirm('Reset scores and clear all answered clues for a new match?')) resetMatch(game);
            }}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            New Match
          </button>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        {(['round1', 'round2'] as const).map((r) => (
          <button
            key={r}
            disabled={!!live.activeClue}
            onClick={() => setRound(r)}
            className={`rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
              live.currentRound === r ? 'bg-gold text-board-darker' : 'border border-slate-700 hover:bg-slate-800'
            }`}
          >
            {r === 'round1' ? game.round1.name : game.round2.name}
          </button>
        ))}
        {roundComplete && !live.activeClue && (
          <span className="self-center text-sm text-emerald-400">
            Round complete{live.currentRound === 'round1' ? ' — switch to Round 2 when ready' : ''}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <MiniBoard
            round={round}
            answeredClueIds={live.answeredClueIds}
            activeClueId={live.activeClue?.clueId ?? null}
            locked={!!live.activeClue}
            onOpenClue={(categoryId, clue) => openClue({ categoryId, clueId: clue.id, value: clue.value })}
          />

          {activeCategory && activeClueObj && (
            <CluePanel
              category={activeCategory}
              clue={activeClueObj}
              stage={live.revealStage}
              onRevealAnswer={revealAnswer}
              onCloseNoScore={closeWithoutScoring}
            />
          )}
        </div>

        <ScorePanel />
      </div>
    </div>
  );
}
