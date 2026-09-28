import { create } from 'zustand';
import { Game } from '../types';
import {
  ActiveClueRef,
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
  revealAnswer: () => void;
  awardAndClose: (teamId: string, delta: number) => void;
  penalizeKeepOpen: (teamId: string, delta: number) => void;
  closeWithoutScoring: () => void;
  adjustScore: (teamId: string, delta: number) => void;
  setScore: (teamId: string, value: number) => void;
}

function isClueAnswered(state: LiveState, clueId: string) {
  return state.answeredClueIds.includes(clueId);
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
      revealStage: 'board',
      updatedAt: Date.now(),
    };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  openClue: (ref) => {
    const current = get().live;
    if (!current || isClueAnswered(current, ref.clueId)) return;
    const live: LiveState = { ...current, activeClue: ref, revealStage: 'question', updatedAt: Date.now() };
    persistLiveState(live);
    set({ live });
    get().channel?.postMessage({ type: 'sync', state: live });
  },

  revealAnswer: () => {
    const current = get().live;
    if (!current || !current.activeClue) return;
    const live: LiveState = { ...current, revealStage: 'answer', updatedAt: Date.now() };
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
      revealStage: 'board',
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
      revealStage: 'board',
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
}));
