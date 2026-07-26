'use client';

interface Props {
  completed: number;
  total: number;
  label: string;
  onClick?: () => void;
}

export function LiveEditorProgressBadge({ completed, total, label, onClick }: Props) {
  const pct = Math.round((completed / Math.max(total, 1)) * 100);
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  const inner = (
    <>
      <svg className="live-editor-progress__ring" viewBox="0 0 36 36" aria-hidden>
        <circle className="live-editor-progress__track" cx="18" cy="18" r={r} />
        <circle
          className="live-editor-progress__fill"
          cx="18"
          cy="18"
          r={r}
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="live-editor-progress__value">{completed}/{total}</span>
      <span className="live-editor-progress__label">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="live-editor-progress"
        onClick={onClick}
        data-testid="live-editor-progress"
        aria-label={label}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="live-editor-progress live-editor-progress--static" data-testid="live-editor-progress">
      {inner}
    </div>
  );
}
