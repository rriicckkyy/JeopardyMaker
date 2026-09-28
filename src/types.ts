export type MediaType = 'image' | 'audio' | 'video';

export interface ClueMedia {
  /** key into the IndexedDB "media" object store */
  id: string;
  type: MediaType;
  fileName: string;
  mimeType: string;
}

export interface Clue {
  id: string;
  value: number;
  prompt: string;
  answer: string;
  media: ClueMedia | null;
}

export interface Category {
  id: string;
  name: string;
  /** always the same length as the owning round's `values`, in the same order */
  clues: Clue[];
}

export type RoundId = 'round1' | 'round2';

export interface Round {
  id: RoundId;
  name: string;
  values: number[];
  categories: Category[];
}

export interface Team {
  id: string;
  name: string;
  color: string;
}

export interface Game {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  round1: Round;
  round2: Round;
  teams: Team[];
}

export interface GameSummary {
  id: string;
  title: string;
  updatedAt: number;
}
