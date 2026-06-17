'use client';

import { useTransition } from 'react';
import { toggleTemplateAction } from '@/app/admin/templates/actions';

interface Props {
  id: string;
  initial: boolean;
  field: 'isActive' | 'isFeatured';
}

export function ToggleTemplateButton({ id, initial, field }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleTemplateAction(id, field);
          } catch (e) {
            console.error(e);
          }
        })
      }
      disabled={pending}
      className={`w-9 h-5 rounded-full transition-colors relative ${
        initial ? 'bg-emerald-500' : 'bg-stone-300'
      } ${pending ? 'opacity-50' : ''}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          initial ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
