/** Allowed emoji reaction keys on the wishes wall. */
export const WISH_REACTION_EMOJIS = ['heart', 'pray', 'celebrate', 'clap'] as const;

export type WishReactionEmoji = (typeof WISH_REACTION_EMOJIS)[number];

export const WISH_REACTION_DISPLAY: Record<WishReactionEmoji, string> = {
  heart: '❤️',
  pray: '🙏',
  celebrate: '🎉',
  clap: '👏',
};

export function isWishReactionEmoji(value: string): value is WishReactionEmoji {
  return (WISH_REACTION_EMOJIS as readonly string[]).includes(value);
}

export function emptyReactionCounts(): Record<WishReactionEmoji, number> {
  return { heart: 0, pray: 0, celebrate: 0, clap: 0 };
}

export function aggregateReactionCounts(
  rows: { emoji: string }[],
): Record<WishReactionEmoji, number> {
  const counts = emptyReactionCounts();
  for (const row of rows) {
    if (isWishReactionEmoji(row.emoji)) {
      counts[row.emoji] += 1;
    }
  }
  return counts;
}
