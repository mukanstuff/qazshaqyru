type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
};

const SIZES = {
  sm: { text: 'text-sm' },
  md: { text: 'text-base' },
  lg: { text: 'text-lg' },
} as const;

/**
 * BrandMark — логотип QazShaqyru.
 * Текстовый wordmark (бирюзовый Алатау).
 */
export function BrandMark({ className, size = 'md', withText = true }: BrandMarkProps) {
  const s = SIZES[size];
  return (
    <span className={['inline-flex items-center gap-2', className].filter(Boolean).join(' ')}>
      {withText && (
        <span
          className={[
            'font-display font-bold tracking-tight whitespace-nowrap',
            s.text,
          ].join(' ')}
          style={{ color: '#16A34A' }}
        >
          QazShaqyru
        </span>
      )}
    </span>
  );
}