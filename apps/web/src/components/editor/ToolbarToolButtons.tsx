'use client';

import {
  Image as ImageIcon,
  Images,
  LayoutTemplate,
  Music2,
  Type,
  Users,
  Gift,
  Instagram,
  MoreHorizontal,
  Armchair,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';
import { ToolbarButton } from './ToolbarButton';
import { TemplateGridPanel } from './TemplateGridPanel';
import { EditorPanelPortal } from './EditorPanelPortal';

export type EditorPanelId =
  | 'template'
  | 'background'
  | 'guests'
  | 'seating'
  | 'ai'
  | 'music'
  | 'gallery'
  | 'kaspi'
  | 'social'
  | 'presets';

interface ToolbarToolButtonsProps {
  activePanel: EditorPanelId | null;
  onTogglePanel: (panel: EditorPanelId) => void;
  currentTemplateKey: string;
  onTemplateSelect: (slug: string) => void;
  guestCount: number;
  onApplyProgramPreset?: () => Promise<void>;
}

export function ToolbarToolButtons({
  activePanel,
  onTogglePanel,
  currentTemplateKey,
  onTemplateSelect,
  guestCount,
  onApplyProgramPreset,
}: ToolbarToolButtonsProps) {
  const { t } = useI18n();
  const [showMore, setShowMore] = useState(false);

  const advancedActive =
    showMore ||
    activePanel === 'gallery' ||
    activePanel === 'kaspi' ||
    activePanel === 'social' ||
    activePanel === 'music' ||
    activePanel === 'ai';

  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto px-4 py-2',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      )}
    >
      <div className="relative shrink-0">
        <ToolbarButton
          active={activePanel === 'template'}
          onClick={() => onTogglePanel('template')}
          icon={<LayoutTemplate size={15} />}
          label={t('invitation.edit.toolbarTemplate')}
        />
        {activePanel === 'template' && (
          <EditorPanelPortal>
            <TemplateGridPanel currentTemplateKey={currentTemplateKey} onSelect={onTemplateSelect} />
          </EditorPanelPortal>
        )}
      </div>

      <ToolbarButton
        active={activePanel === 'background'}
        onClick={() => onTogglePanel('background')}
        icon={<ImageIcon size={15} />}
        label={t('invitation.edit.toolbarBackground')}
      />

      <ToolbarButton
        active={activePanel === 'presets'}
        onClick={() => onTogglePanel('presets')}
        icon={<Type size={15} />}
        label={t('invitation.edit.toolbarTextPresets')}
      />

      <ToolbarButton
        active={activePanel === 'guests'}
        onClick={() => onTogglePanel('guests')}
        icon={<Users size={15} />}
        label={`${t('invitation.edit.toolbarGuests')}${guestCount > 0 ? ` (${guestCount})` : ''}`}
      />

      <ToolbarButton
        active={activePanel === 'seating'}
        onClick={() => onTogglePanel('seating')}
        icon={<Armchair size={15} />}
        label={t('invitation.edit.toolbarSeating')}
      />

      <ToolbarButton
        active={advancedActive && activePanel === null}
        onClick={() => setShowMore((v) => !v)}
        icon={<MoreHorizontal size={15} />}
        label={t('invitation.edit.toolbarMore')}
        title={t('invitation.edit.toolbarMoreHint')}
      />

      {advancedActive ? (
        <>
          <ToolbarButton
            active={activePanel === 'ai'}
            onClick={() => onTogglePanel('ai')}
            icon={<Sparkles size={15} />}
            label={t('invitation.edit.toolbarAi')}
          />

          <ToolbarButton
            active={activePanel === 'gallery'}
            onClick={() => onTogglePanel('gallery')}
            icon={<Images size={15} />}
            label={t('invitation.edit.toolbarGallery')}
          />

          <ToolbarButton
            active={activePanel === 'kaspi'}
            onClick={() => onTogglePanel('kaspi')}
            icon={<Gift size={15} />}
            label={t('invitation.edit.toolbarKaspi')}
          />

          <ToolbarButton
            active={activePanel === 'social'}
            onClick={() => onTogglePanel('social')}
            icon={<Instagram size={15} />}
            label={t('invitation.edit.toolbarSocial')}
          />

          <ToolbarButton
            active={activePanel === 'music'}
            onClick={() => onTogglePanel('music')}
            icon={<Music2 size={15} />}
            label={t('invitation.edit.toolbarMusic')}
          />

          {onApplyProgramPreset ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => void onApplyProgramPreset()}
            >
              {t('invitation.content.program')}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
