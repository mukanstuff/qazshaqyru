'use client';

import { Loader2, UserPlus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { GuestAnalyticsBar } from '@/components/dashboard/GuestAnalyticsBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EditorGuestInfo } from './types';
import { EditorPanelShell } from './EditorPanelShell';

export interface GuestsPanelProps {
  displayGuests: EditorGuestInfo[];
  personalLinksMode: boolean;
  openRsvp: boolean;
  isDraft: boolean;
  editingGuestId: string | null;
  editGuestName: string;
  editGuestPhone: string;
  editGuestHasPlusOne: boolean;
  editGuestHousehold: string;
  savingGuestEdit: boolean;
  guestName: string;
  guestPhone: string;
  guestHasPlusOne: boolean;
  guestSide: 'bride' | 'groom' | '';
  guestHousehold: string;
  showBulkGuests: boolean;
  bulkGuestText: string;
  addingGuests: boolean;
  deletingGuestId: string | null;
  onToggleOpenRsvp: (personalLinks: boolean) => void;
  onStartEditGuest: (guest: EditorGuestInfo) => void;
  onSaveGuestEdit: () => void;
  onCancelEditGuest: () => void;
  onDeleteGuest: (guestId: string) => void;
  onToggleBulkGuests: () => void;
  onBulkAddGuests: () => void;
  onAddGuest: () => void;
  setEditGuestName: (v: string) => void;
  setEditGuestPhone: (v: string) => void;
  setEditGuestHasPlusOne: (v: boolean) => void;
  setEditGuestHousehold: (v: string) => void;
  setGuestName: (v: string) => void;
  setGuestPhone: (v: string) => void;
  setGuestHasPlusOne: (v: boolean) => void;
  setGuestSide: (v: 'bride' | 'groom' | '') => void;
  setGuestHousehold: (v: string) => void;
  setBulkGuestText: (v: string) => void;
  rsvpStatusLabel: (status: string | null | undefined) => string;
  hasUpdateGuest: boolean;
  hasDeleteGuest: boolean;
  onClose: () => void;
}

export function GuestsPanel({
  displayGuests,
  personalLinksMode,
  isDraft,
  editingGuestId,
  editGuestName,
  editGuestPhone,
  editGuestHasPlusOne,
  editGuestHousehold,
  savingGuestEdit,
  guestName,
  guestPhone,
  guestHasPlusOne,
  guestSide,
  guestHousehold,
  showBulkGuests,
  bulkGuestText,
  addingGuests,
  deletingGuestId,
  onToggleOpenRsvp,
  onStartEditGuest,
  onSaveGuestEdit,
  onCancelEditGuest,
  onDeleteGuest,
  onToggleBulkGuests,
  onBulkAddGuests,
  onAddGuest,
  setEditGuestName,
  setEditGuestPhone,
  setEditGuestHasPlusOne,
  setEditGuestHousehold,
  setGuestName,
  setGuestPhone,
  setGuestHasPlusOne,
  setGuestSide,
  setGuestHousehold,
  setBulkGuestText,
  rsvpStatusLabel,
  hasUpdateGuest,
  hasDeleteGuest,
  onClose,
}: GuestsPanelProps) {
  const { t } = useI18n();

  return (
    <EditorPanelShell title={t('invitation.guests.guestListTitle')} onClose={onClose}>
      {displayGuests.length > 0 && (
        <div className="rounded-md border border-us-border bg-us-ivory p-3">
          <GuestAnalyticsBar
            guestRows={displayGuests.map((g) => ({
              response: g.responseStatus ? { status: g.responseStatus } : null,
            }))}
            t={t}
          />
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-us-border p-3">
        <input
          type="checkbox"
          checked={personalLinksMode}
          onChange={(e) => onToggleOpenRsvp(!e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-us-border text-us-accent focus:ring-us-accent"
        />
        <span className="font-body text-sm text-us-ink">
          {t('invitation.guests.openRsvp')}
          <span className="mt-0.5 block text-xs text-us-ink-muted">
            {t('invitation.guests.openRsvpHint')}
          </span>
        </span>
      </label>

      {editingGuestId && (
        <div className="space-y-3 rounded-md border border-us-accent/20 bg-us-accent/5 p-3">
          <Input
            type="text"
            value={editGuestName}
            onChange={(e) => setEditGuestName(e.target.value)}
            placeholder={t('invitation.guests.namePlaceholder')}
          />
          <Input
            type="tel"
            value={editGuestPhone}
            onChange={(e) => setEditGuestPhone(e.target.value)}
            placeholder={t('invitation.guests.phonePlaceholder')}
          />
          <Input
            type="text"
            value={editGuestHousehold}
            onChange={(e) => setEditGuestHousehold(e.target.value)}
            placeholder="Семья / household"
          />
          <label className="flex items-center gap-2 font-body text-sm text-us-ink">
            <input
              type="checkbox"
              checked={editGuestHasPlusOne}
              onChange={(e) => setEditGuestHasPlusOne(e.target.checked)}
              className="h-4 w-4 rounded border-us-border text-us-accent"
            />
            {t('invitation.guests.plusOneLabel')}
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={() => void onSaveGuestEdit()}
              disabled={savingGuestEdit || !editGuestName.trim()}
            >
              {t('common.save')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancelEditGuest}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 my-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const firstWithPhone = displayGuests.find((g: EditorGuestInfo) => g.phone);
            if (!firstWithPhone || !firstWithPhone.phone) {
              alert('Добавьте гостям номера телефонов, чтобы рассылать в WhatsApp');
              return;
            }
            const phone = firstWithPhone.phone.replace(/\D/g, '');
            const url = `https://wa.me/${phone}?text=${encodeURIComponent('Приглашаем вас на торжество! Ссылка на приглашение отправлена в сообщении.')}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
        >
          📲 Разослать в WhatsApp
        </Button>
      </div>

      {displayGuests.length > 0 && (
        <ul className="divide-y divide-us-border rounded-md border border-us-border">
          {displayGuests.map((g, i) => (
            <li
              key={g.id ?? `${g.name}-${i}`}
              className="flex items-start justify-between gap-2 p-3"
            >
              <div className="min-w-0">
                <div className="font-body text-sm font-medium text-us-ink">{g.name}</div>
                {g.householdLabel ? (
                  <div className="font-body text-xs text-us-ink-muted">{g.householdLabel}</div>
                ) : null}
                {g.responseStatus && (
                  <div className="font-body text-xs text-us-accent">
                    {rsvpStatusLabel(g.responseStatus)}
                  </div>
                )}
                {g.hasPlusOne && (
                  <div className="font-body text-xs text-us-ink-muted">
                    {t('invitation.guests.plusOneAllowed')}
                  </div>
                )}
                {g.responseDietary && (
                  <div className="font-body text-xs text-us-ink-muted">
                    {t('invitation.guests.dietary').replace('{value}', g.responseDietary)}
                  </div>
                )}
                {g.responseMessage && (
                  <div className="font-body text-xs text-us-ink-muted">
                    {t('invitation.guests.guestMessage').replace('{value}', g.responseMessage)}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {g.id && hasUpdateGuest && editingGuestId !== g.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onStartEditGuest(g)}
                    aria-label={t('invitation.guests.editGuest')}
                  >
                    ✎
                  </Button>
                )}
                {g.id && hasDeleteGuest && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void onDeleteGuest(g.id!)}
                    disabled={deletingGuestId === g.id}
                    aria-label={t('common.deleteGuest')}
                    className="text-us-danger hover:text-us-danger"
                  >
                    {deletingGuestId === g.id ? '…' : '✕'}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {!personalLinksMode ? (
          <p className="font-body text-xs text-us-ink-muted">{t('common.rsvpHintPublished')}</p>
        ) : (
          <p className="font-body text-xs text-us-ink-muted">{t('invitation.guests.personalLinksHint')}</p>
        )}
        {personalLinksMode && (
          <Button type="button" variant="outline" size="sm" onClick={onToggleBulkGuests}>
            {t('invitation.guests.bulkToggle')}
          </Button>
        )}

        {personalLinksMode && showBulkGuests ? (
          <>
            <p className="font-body text-xs text-us-ink-muted">{t('invitation.guests.bulkHint')}</p>
            <textarea
              value={bulkGuestText}
              onChange={(e) => setBulkGuestText(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-us-border bg-us-surface px-3 py-2 font-body text-sm text-us-ink shadow-us-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent"
            />
            <Button
              type="button"
              variant="dark"
              onClick={() => void onBulkAddGuests()}
              disabled={addingGuests || !bulkGuestText.trim()}
            >
              {t('invitation.guests.bulkAdd')}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <Input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t('invitation.guests.namePlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void onAddGuest();
                }
              }}
            />
            <Input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder={t('invitation.guests.phonePlaceholder')}
            />
            <Input
              type="text"
              value={guestHousehold}
              onChange={(e) => setGuestHousehold(e.target.value)}
              placeholder="Семья / household"
            />
            <div className="space-y-2">
              <Label>{t('invitation.guests.sideLabel')}</Label>
              <select
                value={guestSide}
                onChange={(e) => setGuestSide(e.target.value as 'bride' | 'groom' | '')}
                className="h-10 w-full rounded-md border border-us-border bg-us-surface px-3 font-body text-sm text-us-ink shadow-us-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent"
              >
                <option value="">{t('invitation.guests.sideNone')}</option>
                <option value="bride">{t('invitation.guests.sideBride')}</option>
                <option value="groom">{t('invitation.guests.sideGroom')}</option>
              </select>
            </div>
            <label className="flex items-center gap-2 font-body text-sm text-us-ink">
              <input
                type="checkbox"
                checked={guestHasPlusOne}
                onChange={(e) => setGuestHasPlusOne(e.target.checked)}
                className="h-4 w-4 rounded border-us-border text-us-accent"
              />
              {t('invitation.guests.plusOneLabel')}
            </label>
            <Button
              type="button"
              variant="default"
              onClick={() => void onAddGuest()}
              disabled={addingGuests || !guestName.trim()}
            >
              {addingGuests ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {t('invitation.guests.add')}
            </Button>
          </div>
        )}
      </div>

      {isDraft && (
        <p className="rounded-md border border-us-cta/30 bg-us-cta/5 px-3 py-2 font-body text-xs text-us-ink-muted">
          {t('common.rsvpHintDraft')}
        </p>
      )}
    </EditorPanelShell>
  );
}
