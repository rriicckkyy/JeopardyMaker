import { Category, Clue, Game, Round, RoundId, Team } from '../types';
import { makeId } from './id';

export const ROUND1_VALUES = [100, 200, 300, 400, 500];
export const ROUND2_VALUES = [200, 400, 600, 800, 1000];

export const TEAM_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#14b8a6',
  '#ec4899',
];

export function makeClue(value: number): Clue {
  return {
    id: makeId('clue'),
    value,
    prompt: '',
    answer: '',
    media: null,
  };
}

export function makeCategory(values: number[], name = ''): Category {
  return {
    id: makeId('cat'),
    name,
    clues: values.map(makeClue),
  };
}

export function makeRound(id: 'round1' | 'round2', name: string, values: number[], categoryCount: number): Round {
  return {
    id,
    name,
    values,
    categories: Array.from({ length: categoryCount }, () => makeCategory(values)),
  };
}

export function makeTeam(name: string, colorIndex: number): Team {
  return {
    id: makeId('team'),
    name,
    color: TEAM_COLORS[colorIndex % TEAM_COLORS.length],
  };
}

export function createBlankGame(title = 'New Game'): Game {
  const now = Date.now();
  return {
    id: makeId('game'),
    title,
    createdAt: now,
    updatedAt: now,
    round1: makeRound('round1', 'Round 1', ROUND1_VALUES, 5),
    round2: makeRound('round2', 'Round 2', ROUND2_VALUES, 5),
    teams: [makeTeam('Team 1', 0), makeTeam('Team 2', 1)],
  };
}

export function addCategory(round: Round): Round {
  return {
    ...round,
    categories: [...round.categories, makeCategory(round.values)],
  };
}

export function removeCategory(round: Round, categoryId: string): Round {
  return {
    ...round,
    categories: round.categories.filter((c) => c.id !== categoryId),
  };
}

export function updateRound(game: Game, roundId: RoundId, updater: (r: Round) => Round): Game {
  if (roundId === 'round1') return { ...game, round1: updater(game.round1) };
  return { ...game, round2: updater(game.round2) };
}

export function updateCategory(round: Round, categoryId: string, updater: (c: Category) => Category): Round {
  return {
    ...round,
    categories: round.categories.map((c) => (c.id === categoryId ? updater(c) : c)),
  };
}

export function updateClue(category: Category, clueId: string, updater: (c: Clue) => Clue): Category {
  return {
    ...category,
    clues: category.clues.map((cl) => (cl.id === clueId ? updater(cl) : cl)),
  };
}

export interface ClueRef {
  categoryId: string;
  clueId: string;
}

/**
 * Swaps the editable content (prompt/answer/media) of two clues, wherever they sit
 * in the round — same category or different. Each clue's `id` and `value` stay put,
 * since `value` is tied to row position: the content just moves to a new money slot,
 * so it always lands with the correct value already attached.
 */
export function swapClueContent(round: Round, a: ClueRef, b: ClueRef): Round {
  if (a.categoryId === b.categoryId && a.clueId === b.clueId) return round;

  const findClue = (ref: ClueRef): Clue | undefined =>
    round.categories.find((c) => c.id === ref.categoryId)?.clues.find((cl) => cl.id === ref.clueId);

  const clueA = findClue(a);
  const clueB = findClue(b);
  if (!clueA || !clueB) return round;

  const contentA = { prompt: clueA.prompt, answer: clueA.answer, media: clueA.media };
  const contentB = { prompt: clueB.prompt, answer: clueB.answer, media: clueB.media };

  return {
    ...round,
    categories: round.categories.map((cat) => {
      if (cat.id !== a.categoryId && cat.id !== b.categoryId) return cat;
      return {
        ...cat,
        clues: cat.clues.map((cl) => {
          if (cat.id === a.categoryId && cl.id === a.clueId) return { ...cl, ...contentB };
          if (cat.id === b.categoryId && cl.id === b.clueId) return { ...cl, ...contentA };
          return cl;
        }),
      };
    }),
  };
}
