import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  emptyStore,
  type LeaderboardStore,
  publicView,
  applySubmission,
} from './leaderboards';

const DATA_PATH = join(process.cwd(), 'data', 'leaderboards.json');

export async function readStore(): Promise<LeaderboardStore> {
  try {
    const raw = await readFile(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw) as LeaderboardStore;
    if (!parsed.allTime || !parsed.today) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export async function writeStore(store: LeaderboardStore): Promise<void> {
  await mkdir(dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(store, null, 2), 'utf8');
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
