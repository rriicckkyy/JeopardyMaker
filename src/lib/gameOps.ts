import { Game } from '../types';
import { deleteGame, deleteMedia, loadMedia, saveGame, saveMedia } from './db';
import { makeId } from './id';

function allClues(game: Game) {
  return [...game.round1.categories, ...game.round2.categories].flatMap((c) => c.clues);
}

export async function deleteGameCompletely(game: Game): Promise<void> {
  const mediaIds = allClues(game)
    .map((c) => c.media?.id)
    .filter((id): id is string => Boolean(id));
  await Promise.all(mediaIds.map((id) => deleteMedia(id)));
  await deleteGame(game.id);
}

/**
 * Every clue's media blob gets its own fresh copy so that deleting one game's
 * media never orphans a reference still used by a duplicated game.
 */
export async function duplicateGame(game: Game): Promise<Game> {
  const copy: Game = structuredClone(game);
  copy.id = makeId('game');
  copy.title = `${game.title} (Copy)`;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();

  for (const clue of allClues(copy)) {
    if (!clue.media) continue;
    const blob = await loadMedia(clue.media.id);
    const newId = makeId('media');
    if (blob) await saveMedia(newId, blob);
    clue.media = { ...clue.media, id: newId };
  }

  await saveGame(copy);
  return copy;
}
