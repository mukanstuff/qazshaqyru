'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/shared/utils';

interface EditableFieldProps {
  value: string;
  field: string;
  onSave: (field: string, value: string) => void | Promise<void>;
  as?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
}

/**
 * Tap-to-edit inline field (toi-style): click text → input → blur saves.
 */
export function EditableField({
  value,
  field,
  onSave,
  as: Tag = 'span',
  className,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = async () => {
    setEditing(false);
    if (draft !== value) await onSave(field, draft);
  };

  if (!editing) {
    return (
      <Tag
        role="button"
        tabIndex={0}
        data-edit-field={field}
        className={cn('inv-editable-field', className)}
        aria-label={`Изменить: ${value || field}`}
        onClick={(e) => {
          e.stopPropagation();
          setDraft(value);
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setDraft(value);
            setEditing(true);
          }
        }}
      >
        {value || '—'}
      </Tag>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      data-edit-field={field}
      aria-label={field}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') void commit();
        if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={cn('inv-editable-field inv-editable-field--active', className)}
    />
  );
}
