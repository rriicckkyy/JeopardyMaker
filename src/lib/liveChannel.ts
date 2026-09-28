import { Game, RoundId } from '../types';

export type RevealStage = 'board' | 'question' | 'answer';

export interface TeamScore {
  id: string;
  name: string;
  color: string;
  score: number;
}

export interface ActiveClueRef {
  categoryId: string;
  clueId: string;
  value: number;
}

export interface LiveState {
  gameId: string;
  currentRound: RoundId;
  activeClue: ActiveClueRef | null;
  revealStage: RevealStage;
  answeredClueIds: string[];
  teams: TeamScore[];
  updatedAt: number;
}

export type ChannelMessage = { type: 'sync'; state: LiveState } | { type: 'request-sync' };

function channelName(gameId: string) {
  return `jeopardy-live-${gameId}`;
}

function storageKey(gameId: string) {
  return `jeopardy-live-state-${gameId}`;
}

export function freshLiveState(game: Game): LiveState {
  return {
    gameId: game.id,
    currentRound: 'round1',
    activeClue: null,
    revealStage: 'board',
    answeredClueIds: [],
    teams: game.teams.map((t) => ({ id: t.id, name: t.name, color: t.color, score: 0 })),
    updatedAt: Date.now(),
  };
}

export function loadLiveState(gameId: string): LiveState | null {
  try {
    const raw = localStorage.getItem(storageKey(gameId));
    if (!raw) return null;
    return JSON.parse(raw) as LiveState;
  } catch {
    return null;
  }
}

export function persistLiveState(state: LiveState): void {
  try {
    localStorage.setItem(storageKey(state.gameId), JSON.stringify(state));
  } catch {
    /* localStorage full or unavailable; live sync still works in-memory */
  }
}

export function clearLiveState(gameId: string): void {
  localStorage.removeItem(storageKey(gameId));
}

export function openLiveChannel(gameId: string, onMessage: (msg: ChannelMessage) => void): BroadcastChannel {
  const channel = new BroadcastChannel(channelName(gameId));
  channel.onmessage = (ev) => onMessage(ev.data as ChannelMessage);
  return channel;
}
