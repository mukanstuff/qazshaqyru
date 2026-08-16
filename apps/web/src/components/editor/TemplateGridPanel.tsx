'use client';

import { Check } from 'lucide-react';
import { RemoteMediaImage } from '@/components/shared/RemoteMediaImage';
import { TEMPLATE_CONFIGS } from '@/lib/templates/configs';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

const CATEGORIES = [
  { key: 'wedding' },
  { key: 'toy' },
  { key: 'betashar' },
  { key: 'kyz_uzatu' },
  { key: 'birthday' },
  { key: 'anniversary' },
  { key: 'corporate' },
  { key: 'other' },
] as const;

function templateMatchesCategory(slug: string, categoryKey: string): boolean {
  if (categoryKey === 'kyz_uzatu') return slug.startsWith('kyz-');
  if (categoryKey === 'other') {
    const known = ['wedding', 'toy', 'betashar', 'kyz-', 'birthday', 'anniversary', 'corporate'];
    return !known.some((p) => slug.startsWith(p));
  }
  return slug.startsWith(categoryKey);
}

interface TemplateGridPanelProps {
  currentTemplateKey: string;
  onSelect: (slug: string) => void;
}

export function TemplateGridPanel({ currentTemplateKey, onSelect }: TemplateGridPanelProps) {
  const { t } = useI18n();
  const templates = Object.values(TEMPLATE_CONFIGS);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-us-surface lg:inset-auto lg:right-4 lg:top-[calc(var(--kz-editor-toolbar-h,4rem)+1rem)] lg:max-h-[calc(100vh-var(--kz-editor-toolbar-h,4rem)-2rem)] lg:w-[28rem] lg:rounded-lg lg:border lg:border-us-border lg:shadow-us-lg">
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {CATEGORIES.map((cat) => {
          const catTemplates = templates.filter((tmpl) => templateMatchesCategory(tmpl.slug, cat.key));
          if (catTemplates.length === 0) return null;
          return (
            <div key={cat.key} className="space-y-2">
              <p className="us-overline">{t(`events.${cat.key}` as 'events.wedding')}</p>
              <div className="grid grid-cols-3 gap-2">
                {catTemplates.map((tmpl) => (
                  <button
                    key={tmpl.slug}
                    type="button"
                    onClick={() => onSelect(tmpl.slug)}
                    className={cn(
                      'relative aspect-[3/4] overflow-hidden rounded-md border transition-all',
                      currentTemplateKey === tmpl.slug
                        ? 'ring-2 ring-us-accent ring-offset-2'
                        : 'border-us-border hover:border-us-accent/30'
                    )}
                  >
                    <RemoteMediaImage src={tmpl.coverUrl} alt={tmpl.slug} fill className="object-cover" />
                    {currentTemplateKey === tmpl.slug && (
                      <div className="absolute inset-0 flex items-center justify-center bg-us-accent/30 text-white">
                        <Check size={18} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
