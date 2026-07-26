'use client';

import { Instagram, Send } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorPanelShell } from './EditorPanelShell';

interface Props {
  instagramUrl: string;
  telegramUrl: string;
  onSave: (field: 'instagramUrl' | 'telegramUrl', value: string) => void;
  onClose: () => void;
}

export function SocialPanel({ instagramUrl, telegramUrl, onSave, onClose }: Props) {
  const { t } = useI18n();

  return (
    <EditorPanelShell title={t('invitation.edit.toolbarSocial')} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instagram-url" className="flex items-center gap-2">
            <Instagram size={16} className="text-us-accent" />
            Instagram
          </Label>
          <Input
            id="instagram-url"
            type="url"
            value={instagramUrl}
            onChange={(e) => onSave('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telegram-url" className="flex items-center gap-2">
            <Send size={16} className="text-us-accent" />
            Telegram
          </Label>
          <Input
            id="telegram-url"
            type="url"
            value={telegramUrl}
            onChange={(e) => onSave('telegramUrl', e.target.value)}
            placeholder="https://t.me/..."
          />
        </div>
      </div>
    </EditorPanelShell>
  );
}
