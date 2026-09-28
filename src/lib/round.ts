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
