'use client';

import { useTransition } from 'react';
import { toggleTemplateAction } from '@/app/admin/templates/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';

interface Props {
  id: string;
  initial: boolean;
  field: 'isActive' | 'isFeatured';
}

export function ToggleTemplateButton({ id, initial, field }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={initial ? 'secondary' : 'outline'}
      size="sm"
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
      className={cn(
        'h-7 min-w-[52px] px-2',
        initial && 'border-us-accent/20 bg-us-accent/10 text-us-accent'
      )}
      aria-pressed={initial}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full transition-colors',
          initial ? 'bg-us-accent' : 'bg-us-border',
          pending && 'opacity-50'
        )}
      />
      <span className="sr-only">{initial ? 'Включено' : 'Выключено'}</span>
    </Button>
  );
}
