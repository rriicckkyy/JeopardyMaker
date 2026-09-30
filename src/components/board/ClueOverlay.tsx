import { AnimatePresence, motion } from 'framer-motion';
import { Category, Clue } from '../../types';
import { RevealStage } from '../../lib/liveChannel';
import { useMediaUrl } from '../../hooks/useMediaUrl';

interface Props {
  clue: Clue;
  category: Category;
  stage: RevealStage;
  wager: { teamName: string; amount: number } | null;
}

export default function ClueOverlay({ clue, category, stage, wager }: Props) {
  const mediaUrl = useMediaUrl(clue.media?.id);
  const displayValue = wager ? wager.amount : clue.value;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-6 md:p-14 perspective">
      <motion.div
        className="relative aspect-video w-full max-w-6xl preserve-3d"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        exit={{ rotateY: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-board shadow-2xl backface-hidden">
          <span className="font-display text-6xl text-gold md:text-8xl">
            {stage === 'wager' ? '⭐ WAGER ⭐' : `$${displayValue}`}
          </span>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-2xl bg-board-darker p-6 text-center shadow-2xl backface-hidden md:p-12"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {stage !== 'wager' && (
            <p className="font-display text-lg uppercase tracking-wide text-gold md:text-2xl">
              {category.name} · ${displayValue}
            </p>
          )}
          {wager && stage !== 'wager' && (
            <p className="rounded-md bg-gold/20 px-3 py-1 text-sm font-semibold text-gold md:text-base">
              ⭐ {wager.teamName} wagered ${wager.amount}
            </p>
          )}

          <AnimatePresence mode="wait">
            {stage === 'wager' && (
              <motion.div
                key="wager"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-4"
              >
                <p className="font-display text-4xl text-gold md:text-6xl">⭐ WAGER CLUE ⭐</p>
                <p className="text-lg text-slate-300 md:text-2xl">{category.name}</p>
                <p className="text-sm text-slate-500">The team is deciding their wager…</p>
              </motion.div>
            )}

            {stage === 'question' && (
              <motion.div
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-6"
              >
                {clue.media?.type === 'image' && mediaUrl && (
                  <img src={mediaUrl} alt="Clue" className="max-h-[45vh] rounded-lg object-contain" />
                )}
                {clue.media?.type === 'video' && mediaUrl && (
                  <video src={mediaUrl} autoPlay controls className="max-h-[45vh] rounded-lg" />
                )}
                {clue.media?.type === 'audio' && mediaUrl && (
                  <audio src={mediaUrl} autoPlay controls className="w-full max-w-md" />
                )}
                {clue.prompt && (
                  <p className="text-2xl font-semibold leading-snug md:text-4xl">{clue.prompt}</p>
                )}
              </motion.div>
            )}

            {stage === 'answer' && (
              <motion.div
                key="answer"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4"
              >
                <p className="text-lg text-slate-300 md:text-2xl">{clue.prompt}</p>
                <p className="text-3xl font-bold text-emerald-400 md:text-5xl">{clue.answer || '—'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
