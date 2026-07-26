import { describe, it, expect } from 'vitest';
import {
  aggregateReactionCounts,
  emptyReactionCounts,
  isWishReactionEmoji,
} from '@/lib/wishes/wish-reactions';

describe('wish-reactions', () => {
  it('aggregates reaction counts by emoji', () => {
    const counts = aggregateReactionCounts([
      { emoji: 'heart' },
      { emoji: 'heart' },
      { emoji: 'pray' },
      { emoji: 'clap' },
    ]);
    expect(counts).toEqual({ heart: 2, pray: 1, celebrate: 0, clap: 1 });
  });

  it('validates emoji keys', () => {
    expect(isWishReactionEmoji('heart')).toBe(true);
    expect(isWishReactionEmoji('invalid')).toBe(false);
  });

  it('returns zeroed counts', () => {
    expect(emptyReactionCounts()).toEqual({ heart: 0, pray: 0, celebrate: 0, clap: 0 });
  });
});
