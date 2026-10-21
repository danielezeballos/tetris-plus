import { describe, expect, it } from 'vitest';
import {
  applySubmission,
  emptyStore,
  qualifiesForBoard,
  sortEntries,
  topEntries,
} from './leaderboards';

describe('leaderboards', () => {
  it('sorts by score desc then earlier at first', () => {
    const sorted = sortEntries([
      { name: 'B', score: 100, at: 2 },
      { name: 'A', score: 100, at: 1 },
      { name: 'C', score: 200, at: 3 },
    ]);
    expect(sorted.map((e) => e.name)).toEqual(['C', 'A', 'B']);
  });

  it('qualifies when fewer than five entries or beats fifth', () => {
    const full = topEntries(
      [1, 2, 3, 4, 5].map((s, i) => ({
        name: String(s),
        score: s * 100,
        at: i,
      })),
    );
    expect(qualifiesForBoard(full, 100)).toBe(false);
    expect(qualifiesForBoard(full, 101)).toBe(true);
    expect(qualifiesForBoard(full.slice(0, 3), 1)).toBe(true);
  });

  it('saves anonymous when name empty', () => {
    const store = emptyStore(0);
    const { store: next } = applySubmission(store, 999, '   ', 1);
    expect(next.allTime[0]?.name).toBe('Anonymous');
  });
});
