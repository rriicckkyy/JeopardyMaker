import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Game } from '../types';
import { loadGame } from '../lib/db';
import { useBoardLive } from '../store/useBoardLive';
import BoardGrid from '../components/board/BoardGrid';
import ClueOverlay from '../components/board/ClueOverlay';

export default function Board() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [started, setStarted] = useState(false);
  const live = useBoardLive((s) => s.live);
  const init = useBoardLive((s) => s.init);
  const teardown = useBoardLive((s) => s.teardown);

  useEffect(() => {
    if (!gameId) return;
    loadGame(gameId).then((g) => g && setGame(g));
    init(gameId);
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!game || !live) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading board…</div>;
  }

  if (!started) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-board-darker text-center">
        <h1 className="font-display text-3xl text-gold">{game.title}</h1>
        <p className="max-w-md text-slate-400">
          This is the board display — drag this window to your TV, then click below to start.
          It also enables sound for audio/video clues.
        </p>
        <button
          onClick={() => {
            setStarted(true);
            document.documentElement.requestFullscreen?.().catch(() => {});
          }}
          className="rounded-lg bg-board px-8 py-4 text-lg font-semibold hover:bg-board-dark"
        >
          Start Display
        </button>
      </div>
    );
  }

  const round = live.currentRound === 'round1' ? game.round1 : game.round2;
  const activeCategory = live.activeClue
    ? round.categories.find((c) => c.id === live.activeClue!.categoryId)
    : null;
  const activeClueObj = activeCategory?.clues.find((c) => c.id === live.activeClue!.clueId);
  const wagerInfo = live.activeWager
    ? { teamName: live.teams.find((t) => t.id === live.activeWager!.teamId)?.name ?? 'Unknown team', amount: live.activeWager.amount }
    : null;

  return (
    <div className="flex h-screen flex-col bg-board-darker p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-xl text-gold md:text-2xl">{round.name}</h1>
        <div className="flex gap-4">
          {live.teams.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-sm font-semibold">{t.name}</span>
              <span className="font-display text-lg text-gold">{t.score}</span>
            </div>
          ))}
        </div>
      </header>

      <BoardGrid round={round} answeredClueIds={live.answeredClueIds} />

      <AnimatePresence>
        {activeCategory && activeClueObj && (
          <ClueOverlay
            clue={activeClueObj}
            category={activeCategory}
            stage={live.revealStage}
            wager={wagerInfo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
