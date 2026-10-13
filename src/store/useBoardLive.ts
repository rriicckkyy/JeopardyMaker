import { create } from 'zustand';
import { LiveState, loadLiveState, openLiveChannel } from '../lib/liveChannel';

interface BoardLiveStore {
  live: LiveState | null;
  channel: BroadcastChannel | null;
  connected: boolean;
  init: (gameId: string) => void;
  teardown: () => void;
}

export const useBoardLive = create<BoardLiveStore>((set, get) => ({
  live: null,
  channel: null,
  connected: false,

  init: (gameId) => {
    const cached = loadLiveState(gameId);
    if (cached) set({ live: cached });

    const channel = openLiveChannel(gameId, (msg) => {
      if (msg.type === 'sync') {
        set({ live: msg.state, connected: true });
      }
    });
    set({ channel });
    channel.postMessage({ type: 'request-sync' });
  },

  teardown: () => {
    get().channel?.close();
    set({ channel: null });
  },
}));
