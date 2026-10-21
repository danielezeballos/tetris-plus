import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  emptyStore,
  type LeaderboardStore,
  publicView,
  applySubmission,
} from './leaderboards';

export function leaderboardDataDir(): string {
  const raw = process.env.DATA_DIR?.trim();
  if (raw) return resolve(process.cwd(), raw);
  return resolve(process.cwd(), 'data');
}

export function leaderboardDataPath(): string {
  return join(leaderboardDataDir(), 'leaderboards.json');
}

function dataPath(): string {
  return leaderboardDataPath();
}

export async function readStore(): Promise<LeaderboardStore> {
  try {
    const raw = await readFile(dataPath(), 'utf8');
    const parsed = JSON.parse(raw) as LeaderboardStore;
    if (!parsed.allTime || !parsed.today) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export async function writeStore(store: LeaderboardStore): Promise<void> {
  const path = dataPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(store, null, 2), 'utf8');
}

export async function getLeaderboards() {
  const store = await readStore();
  return publicView(store);
}

export async function submitScore(score: number, name: string) {
  const store = await readStore();
  const result = applySubmission(store, score, name);
  await writeStore(result.store);
  return {
    saved: result.savedAllTime || result.savedToday,
    boards: publicView(result.store),
  };
}
