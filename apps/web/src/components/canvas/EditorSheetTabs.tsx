'use client';

import { useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type SheetTabId = 'wizard' | 'texts' | 'photos' | 'music' | 'sections' | 'layers' | 'design' | 'link';

interface Props {
  defaultTab?: SheetTabId;
  children: Record<SheetTabId, ReactNode>;
  /** Tabs to leave out of the strip entirely — e.g. the admin template
   *  builder has no real invitation behind it, so "Толтыру" (binds fake
   *  guest data to placeholders) and "Ссілтеме" (needs a real order/slug)
   *  don't apply and would just render confusing or empty panels. */
  hiddenTabs?: SheetTabId[];
}

/**
 * Horizontally scrollable tab strip inside the quick-edit bottom sheet, on
 * the shared `Tabs` primitive. Each tab panel mounts lazily on first
 * selection and stays mounted (via `forceMount` + CSS hide) afterwards, so
 * switching tabs never loses in-progress edits in an unmounted panel.
 */
export function EditorSheetTabs({ defaultTab = 'texts', children, hiddenTabs }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<SheetTabId>(defaultTab);
  const [mounted, setMounted] = useState<Set<SheetTabId>>(() => new Set([defaultTab]));

  const handleChange = (id: string) => {
    const tabId = id as SheetTabId;
    setActive(tabId);
    setMounted((prev) => (prev.has(tabId) ? prev : new Set(prev).add(tabId)));
  };

  const allTabs: Array<{ id: SheetTabId; label: string }> = [
    { id: 'wizard', label: t('invitation.edit.canvas.wizard') },
    { id: 'texts', label: t('invitation.edit.canvas.sheet.tabs.texts') },
    { id: 'photos', label: t('invitation.edit.canvas.sheet.tabs.photos') },
    { id: 'music', label: t('invitation.edit.canvas.sheet.tabs.music') },
    { id: 'sections', label: t('invitation.edit.canvas.sheet.tabs.sections') },
    { id: 'layers', label: t('invitation.edit.canvas.sheet.tabs.layers') },
    { id: 'design', label: t('invitation.edit.canvas.sheet.tabs.design') },
    { id: 'link', label: t('invitation.edit.canvas.sheet.tabs.link') },
  ];
  const tabs = hiddenTabs?.length ? allTabs.filter((tab) => !hiddenTabs.includes(tab.id)) : allTabs;

  return (
    <Tabs value={active} onValueChange={handleChange} className="flex min-h-0 flex-1 flex-col">
      <TabsList
        className="sticky top-0 z-10 w-full justify-start gap-2 overflow-x-auto"
        aria-label={t('invitation.edit.canvas.fab.title')}
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="shrink-0 flex-none px-2">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs
        .filter((tab) => mounted.has(tab.id))
        .map((tab) => (
          <TabsContent key={tab.id} value={tab.id} forceMount className="pt-4 data-[state=inactive]:hidden">
            {children[tab.id]}
          </TabsContent>
        ))}
    </Tabs>
  );
}
