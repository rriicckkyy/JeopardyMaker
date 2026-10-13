import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Game, GameSummary } from '../types';

interface JeopardyDB extends DBSchema {
  games: { key: string; value: Game };
  media: { key: string; value: Blob };
}

let dbPromise: Promise<IDBPDatabase<JeopardyDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<JeopardyDB>('jeopardy-maker', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('games')) {
          db.createObjectStore('games', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveGame(game: Game): Promise<void> {
  const db = await getDB();
  await db.put('games', { ...game, updatedAt: Date.now() });
}

export async function loadGame(id: string): Promise<Game | undefined> {
  const db = await getDB();
  return db.get('games', id);
}

export async function listGameSummaries(): Promise<GameSummary[]> {
  const db = await getDB();
  const all = await db.getAll('games');
  return all
    .map((g) => ({ id: g.id, title: g.title, updatedAt: g.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('games', id);
}

export async function saveMedia(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put('media', blob, id);
}

export async function loadMedia(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get('media', id);
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('media', id);
}
