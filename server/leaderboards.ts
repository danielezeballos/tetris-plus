export interface LeaderboardEntry {
  name: string;
  score: number;
  at: number;
}

export interface LeaderboardStore {
  allTime: LeaderboardEntry[];
  today: { date: string; entries: LeaderboardEntry[] };
}

export const TOP_N = 5;
export const MAX_NAME_LENGTH = 40;

export function utcDateString(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.at - b.at;
  });
}

export function topEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return sortEntries(entries).slice(0, TOP_N);
}

export function qualifiesForBoard(
  entries: LeaderboardEntry[],
  score: number,
): boolean {
  const top = topEntries(entries);
  if (top.length < TOP_N) return true;
  const fifth = top[TOP_N - 1];
  return score > fifth.score;
}

export function normalizeName(raw: string): string {
  const trimmed = raw.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : 'Anonymous';
}

export function insertEntry(
  entries: LeaderboardEntry[],
  entry: LeaderboardEntry,
): LeaderboardEntry[] {
  return topEntries([...entries, entry]);
}

export function ensureToday(store: LeaderboardStore, now = Date.now()): void {
  const date = utcDateString(now);
  if (store.today.date !== date) {
    store.today = { date, entries: [] };
  }
}

export function emptyStore(now = Date.now()): LeaderboardStore {
  return {
    allTime: [],
    today: { date: utcDateString(now), entries: [] },
  };
}

export function applySubmission(
  store: LeaderboardStore,
  score: number,
  name: string,
  at = Date.now(),
): { store: LeaderboardStore; savedAllTime: boolean; savedToday: boolean } {
  ensureToday(store, at);
  const entry: LeaderboardEntry = { name: normalizeName(name), score, at };
  const saveAll = qualifiesForBoard(store.allTime, score);
  const saveToday = qualifiesForBoard(store.today.entries, score);
  if (saveAll) {
    store.allTime = insertEntry(store.allTime, entry);
  }
  if (saveToday) {
    store.today.entries = insertEntry(store.today.entries, entry);
  }
  return { store, savedAllTime: saveAll, savedToday: saveToday };
}

export function publicView(store: LeaderboardStore, now = Date.now()): {
  allTime: LeaderboardEntry[];
  today: LeaderboardEntry[];
} {
  ensureToday(store, now);
  return {
    allTime: topEntries(store.allTime),
    today: topEntries(store.today.entries),
  };
}
