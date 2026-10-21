import {
  qualifiesForBoard,
  MAX_NAME_LENGTH,
  type LeaderboardEntry,
} from '../server/leaderboards';

export { MAX_NAME_LENGTH };

export type LeaderboardsView = {
  allTime: LeaderboardEntry[];
  today: LeaderboardEntry[];
};

export async function fetchLeaderboards(): Promise<LeaderboardsView> {
  const res = await fetch('/api/leaderboards');
  if (!res.ok) throw new Error('leaderboards fetch failed');
  return (await res.json()) as LeaderboardsView;
}

export function scoreQualifiesForSubmission(
  boards: LeaderboardsView,
  score: number,
): boolean {
  return (
    qualifiesForBoard(boards.allTime, score) ||
    qualifiesForBoard(boards.today, score)
  );
}

export async function submitLeaderboardScore(
  score: number,
  name: string,
): Promise<{ saved: boolean; boards: LeaderboardsView }> {
  const res = await fetch('/api/leaderboards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, name }),
  });
  if (!res.ok) throw new Error('leaderboards submit failed');
  return (await res.json()) as { saved: boolean; boards: LeaderboardsView };
}

export function formatLeaderboardRows(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) {
    return '<li class="lb-empty">No scores yet</li>';
  }
  return entries
    .map(
      (e) =>
        `<li><span class="lb-name">${escapeHtml(e.name)}</span><span class="lb-score">${e.score.toLocaleString()}</span></li>`,
    )
    .join('');
}

export function formatLeaderboardLoading(): string {
  return '<li class="lb-empty">Loading…</li>';
}

export function formatLeaderboardError(message: string): string {
  return `<li class="lb-error">${escapeHtml(message)}</li>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
