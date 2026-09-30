import { create } from 'zustand';
import { Game } from '../types';
import {
  ActiveClueRef,
  DEFAULT_TIMER_SECONDS,
  LiveState,
  clearLiveState,
  freshLiveState,
  loadLiveState,
  openLiveChannel,
  persistLiveState,
} from '../lib/liveChannel';

interface HostLiveStore {
  live: LiveState | null;
  channel: BroadcastChannel | null;
  init: (game: Game) => void;
  teardown: () => void;
  resetMatch: (game: Game) => void;
  setRound: (round: 'round1' | 'round2') => void;
  openClue: (ref: ActiveClueRef) => void;
  openWagerClue: (ref: ActiveClueRef) => void;
  confirmWager: (teamId: string, amount: number) => void;
  cancelActiveClue: () => void;
  revealAnswer: () => void;
  awardAndClose: (teamId: string, delta: number) => void;
  penalizeKeepOpen: (teamId: string, delta: number) => void;
  closeWithoutScoring: () => void;
  adjustScore: (teamId: string, delta: number) => void;
  setScore: (teamId: string, value: number) => void;
  resetTimer: () => void;
  setTimerDuration: (seconds: number) => void;
}

function isClueAnswered(state: LiveState, clueId: string) {
  return state.answeredClueIds.includes(clueId);
}

/** Old saved sessions from before the timer existed won't have this field yet. */
function durationOf(state: LiveState): number {
  return state.timerDurationSec ?? DEFAULT_TIMER_SECONDS;
}

function freshDeadline(state: LiveState): number {
  return Date.now() + durationOf(state) * 1000;
}

export const useHostLive = create<HostLiveStore>((set, get) => ({
  live: null,
  channel: null,

  init: (game) => {
    const existing = loadLiveState(game.id);
    const live = existing && existing.gameId === game.id ? existing : freshLiveState(game);
    const channel = openLiveChannel(game.id, (msg) => {
      if (msg.type === 'request-sync') {
        const current = get().live;
        if (current) get().channel?.postMessage({ type: 'sync', state: current });
      }
    });
    set({ live, channel });
    channel.postMessage({ type: 'sync', state: live });
  },

  teardown: () => {
    get().channel?.close();
    set({ channel: null });
  },

  resetMatch: (game) => {
    clearLiveState(game.id);
    const live = freshLiveState(game);
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  setRound: (round) => {
    const current = get().live;
    if (!current) return;
    const live: LiveState = {
      ...current,
      currentRound: round,
      activeClue: null,
      activeWager: null,
      revealStage: 'board',
      timerDeadline: null,
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  openClue: (ref) => {
    const current = get().live;
    if (!current || isClueAnswered(current, ref.clueId)) return;
    const live: LiveState = {
      ...current,
      activeClue: ref,
      activeWager: null,
      revealStage: 'question',
      timerDeadline: freshDeadline(current),
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  openWagerClue: (ref) => {
    const current = get().live;
    if (!current || isClueAnswered(current, ref.clueId)) return;
    const live: LiveState = {
      ...current,
      activeClue: ref,
      activeWager: null,
      revealStage: 'wager',
      timerDeadline: null,
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  confirmWager: (teamId, amount) => {
    const current = get().live;
    if (!current || !current.activeClue || current.revealStage !== 'wager') return;
    const live: LiveState = {
      ...current,
      activeWager: { teamId, amount },
      revealStage: 'question',
      timerDeadline: freshDeadline(current),
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  cancelActiveClue: () => {
    const current = get().live;
    if (!current || !current.activeClue) return;
    const live: LiveState = {
      ...current,
      activeClue: null,
      activeWager: null,
      revealStage: 'board',
      timerDeadline: null,
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  revealAnswer: () => {
    const current = get().live;
    if (!current || !current.activeClue) return;
    const live: LiveState = {
      ...current,
      revealStage: 'answer',
      timerDeadline: null,
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  awardAndClose: (teamId, delta) => {
    const current = get().live;
    if (!current || !current.activeClue) return;
    const clueId = current.activeClue.clueId;
    const live: LiveState = {
      ...current,
      teams: current.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t)),
      answeredClueIds: [...current.answeredClueIds, clueId],
      activeClue: null,
      activeWager: null,
      revealStage: 'board',
      timerDeadline: null,
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  penalizeKeepOpen: (teamId, delta) => {
    const current = get().live;
    if (!current || !current.activeClue) return;
    const live: LiveState = {
      ...current,
      teams: current.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t)),
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  closeWithoutScoring: () => {
    const current = get().live;
    if (!current || !current.activeClue) return;
    const live: LiveState = {
      ...current,
      answeredClueIds: [...current.answeredClueIds, current.activeClue.clueId],
      activeClue: null,
      activeWager: null,
      revealStage: 'board',
      timerDeadline: null,
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  adjustScore: (teamId, delta) => {
    const current = get().live;
    if (!current) return;
    const live: LiveState = {
      ...current,
      teams: current.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t)),
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  setScore: (teamId, value) => {
    const current = get().live;
    if (!current) return;
    const live: LiveState = {
      ...current,
      teams: current.teams.map((t) => (t.id === teamId ? { ...t, score: value } : t)),
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  resetTimer: () => {
    const current = get().live;
    if (!current || current.revealStage !== 'question') return;
    const live: LiveState = { ...current, timerDeadline: freshDeadline(current), updatedAt: Date.now() };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  setTimerDuration: (seconds) => {
    const current = get().live;
    if (!current) return;
    const clamped = Math.max(3, Math.min(300, Math.round(seconds)));
    const live: LiveState = { ...current, timerDurationSec: clamped, updatedAt: Date.now() };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },
}));
