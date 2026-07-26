'use client';

import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorPanelShell } from './EditorPanelShell';

interface Props {
  kaspiPhone: string;
  onSave: (phone: string) => void;
  onClose: () => void;
}

export function KaspiPanel({ kaspiPhone, onSave, onClose }: Props) {
  const { t } = useI18n();

  return (
    <EditorPanelShell title={t('invitation.edit.toolbarKaspi')} onClose={onClose}>
      <p className="font-body text-sm text-us-ink-muted">{t('public.kaspi.hint')}</p>
      <div className="space-y-2">
        <Label htmlFor="kaspi-phone">{t('invitation.edit.toolbarKaspi')}</Label>
        <Input
          id="kaspi-phone"
          type="tel"
          value={kaspiPhone}
          onChange={(e) => onSave(e.target.value)}
          placeholder="+7 (___) ___-__-__"
        />
      </div>
      <p className="font-body text-xs text-us-ink-muted">{t('invitation.edit.kaspiHint')}</p>
    </EditorPanelShell>
  );
}
