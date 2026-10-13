import { Game } from '../types';
import { loadMedia, saveGame, saveMedia } from './db';
import { makeId } from './id';

interface ExportedMedia {
  dataUrl: string;
  mimeType: string;
  fileName: string;
}

interface ExportedFile {
  version: 1;
  game: Game;
  media: Record<string, ExportedMedia>;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function allClues(game: Game) {
  return [...game.round1.categories, ...game.round2.categories].flatMap((c) => c.clues);
}

export async function exportGame(game: Game): Promise<void> {
  const media: Record<string, ExportedMedia> = {};

  for (const clue of allClues(game)) {
    if (!clue.media) continue;
    const blob = await loadMedia(clue.media.id);
    if (!blob) continue;
    media[clue.media.id] = {
      dataUrl: await blobToDataUrl(blob),
      mimeType: clue.media.mimeType,
      fileName: clue.media.fileName,
    };
  }

  const payload: ExportedFile = { version: 1, game, media };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${game.title.replace(/[^a-z0-9-_ ]/gi, '_') || 'jeopardy-game'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importGameFromFile(file: File): Promise<Game> {
  const text = await file.text();
  const payload = JSON.parse(text) as ExportedFile;
  if (!payload || payload.version !== 1 || !payload.game) {
    throw new Error('This file is not a valid JeopardyMaker export.');
  }

  const idMap = new Map<string, string>();
  for (const oldId of Object.keys(payload.media)) {
    idMap.set(oldId, makeId('media'));
  }

  const game: Game = structuredClone(payload.game);
  game.id = makeId('game');
  game.updatedAt = Date.now();

  for (const clue of allClues(game)) {
    if (clue.media) {
      const newId = idMap.get(clue.media.id);
      if (newId) clue.media = { ...clue.media, id: newId };
    }
  }

  for (const [oldId, newId] of idMap.entries()) {
    const entry = payload.media[oldId];
    const res = await fetch(entry.dataUrl);
    const blob = await res.blob();
    await saveMedia(newId, blob);
  }

  await saveGame(game);
  return game;
}
