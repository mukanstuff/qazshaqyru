'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download, Link2, MessageCircle, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { useHubGuests, type HubGuest, type GuestStatusFilter } from '@/components/hub/useHubGuests';
import { useGuestInviteLinks } from '@/components/hub/useGuestInviteLinks';

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  invitationSlug: string;
  initialGuests: HubGuest[];
}

function rsvpLabel(status: string | null, t: (key: string) => string): string | null {
  if (!status || status === 'pending') return null;
  if (status === 'attending' || status === 'attending_plus_one' || status === 'attending_no_children') {
    return t('invitation.hub.guestsSheet.statusAttending');
  }
  if (status === 'not_attending') return t('invitation.hub.guestsSheet.statusNotAttending');
  return null;
}

export function HubSheetGuests({ open, onClose, invitationId, invitationSlug, initialGuests }: Props) {
  const { t, locale } = useI18n();
  const hub = useHubGuests(invitationId, initialGuests);

  const invites = useGuestInviteLinks(invitationId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      /* clipboard blocked — the URL is visible in the row anyway */
    }
  };

  const [filter, setFilter] = useState<GuestStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHousehold, setEditHousehold] = useState('');
  const [editHasPlusOne, setEditHasPlusOne] = useState(false);

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [household, setHousehold] = useState('');
  const [hasPlusOne, setHasPlusOne] = useState(false);

  const filtered = useMemo(() => hub.filterGuests(filter, search), [hub, filter, search]);

  const startEdit = (g: HubGuest) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditPhone(g.phone ?? '');
    setEditHousehold(g.householdLabel ?? '');
    setEditHasPlusOne(g.hasPlusOne);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await hub.updateGuest({
      id: editingId,
      name: editName.trim(),
      phone: editPhone.trim() || null,
      hasPlusOne: editHasPlusOne,
      householdLabel: editHousehold.trim() || null,
    });
    setEditingId(null);
  };

  const addOne = async () => {
    if (!name.trim()) return;
    await hub.addGuests([
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        hasPlusOne,
        householdLabel: household.trim() || undefined,
      },
    ]);
    setName('');
    setPhone('');
    setHousehold('');
    setHasPlusOne(false);
  };

  const addBulk = async () => {
    const names = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    await hub.addGuests(names.map((n) => ({ name: n })));
    setBulkText('');
    setBulkMode(false);
  };

  const chips: Array<{ key: GuestStatusFilter; label: string }> = [
    { key: 'all', label: t('invitation.hub.guestsSheet.filterAll') },
    {
      key: 'attending',
      label: t('invitation.hub.guestsSheet.filterAttending').replace('{count}', String(hub.funnel.attending)),
    },
    {
      key: 'not_attending',
      label: t('invitation.hub.guestsSheet.filterNotAttending').replace('{count}', String(hub.funnel.notAttending)),
    },
    {
      key: 'pending',
      label: t('invitation.hub.guestsSheet.filterPending').replace('{count}', String(hub.funnel.pending)),
    },
    {
      key: 'opened',
      label: t('invitation.hub.guestsSheet.filterOpened').replace('{count}', String(hub.funnel.opened)),
    },
  ];

  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.guestsSheet.title')}
      subtitle={t('invitation.hub.guestsSheet.subtitle')}
    >
      {hub.error ? (
        <div className="hub-sheet-toast hub-sheet-toast--err">
          {t(`invitation.hub.guestsSheet.${hub.error}`)}
        </div>
      ) : null}

      {invites.error ? (
        <div className="hub-sheet-toast hub-sheet-toast--err">
          {t(`invitation.hub.guestsSheet.${invites.error}`)}
        </div>
      ) : null}

      <div className="hub-field-label" style={{ marginBottom: 4 }}>
        {t('invitation.hub.guestsSheet.links')}
      </div>
      <p className="hub-hint" style={{ marginBottom: 8 }}>
        {t('invitation.hub.guestsSheet.linksHint')}
      </p>
      <div className="hub-share-buttons" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="hub-btn hub-btn--primary"
          onClick={() => void invites.issue()}
          disabled={invites.pending || hub.guests.length === 0}
        >
          <Link2 size={16} aria-hidden="true" />
          {t('invitation.hub.guestsSheet.linksGenerate')}
        </button>
        <button
          type="button"
          className="hub-btn"
          onClick={() => void invites.issue({ reissue: true })}
          disabled={invites.pending || hub.guests.length === 0}
          title={t('invitation.hub.guestsSheet.linksReissueHint')}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {t('invitation.hub.guestsSheet.linksReissue')}
        </button>
        {/*
          Two formats, because they are for two different people: the xlsx goes
          to the тойхана manager and opens on their Windows Excel without an
          import wizard; the CSV is for anything that eats one.
        */}
        <button
          type="button"
          className="hub-btn"
          onClick={() => void hub.exportGuests(invitationSlug, 'xlsx', locale)}
          disabled={hub.mutating === 'export'}
        >
          <Download size={16} aria-hidden="true" />
          {t('invitation.hub.guestsSheet.exportXlsx')}
        </button>
        <button
          type="button"
          className="hub-btn"
          onClick={() => void hub.exportGuests(invitationSlug, 'csv', locale)}
          disabled={hub.mutating === 'export'}
        >
          <Download size={16} aria-hidden="true" />
          {t('invitation.hub.guestsSheet.exportCsv')}
        </button>
      </div>

      <input
        className="hub-input"
        style={{ marginBottom: 10 }}
        placeholder={t('invitation.hub.guestsSheet.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="hub-chip-row">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`hub-chip${filter === chip.key ? ' hub-chip--active' : ''}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {editingId ? (
        <div className="hub-field" style={{ marginBottom: 12 }}>
          <input
            className="hub-input"
            style={{ marginBottom: 8 }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.namePlaceholder')}
          />
          <input
            className="hub-input"
            style={{ marginBottom: 8 }}
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.phonePlaceholder')}
          />
          <input
            className="hub-input"
            style={{ marginBottom: 8 }}
            value={editHousehold}
            onChange={(e) => setEditHousehold(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.householdPlaceholder')}
          />
          <label className="hub-checkbox-row">
            <input
              type="checkbox"
              checked={editHasPlusOne}
              onChange={(e) => setEditHasPlusOne(e.target.checked)}
            />
            {t('invitation.hub.guestsSheet.plusOneLabel')}
          </label>
          <div className="hub-share-buttons" style={{ marginTop: 0 }}>
            <button type="button" className="hub-btn" onClick={() => setEditingId(null)}>
              {t('invitation.hub.guestsSheet.cancel')}
            </button>
            <button
              type="button"
              className="hub-btn hub-btn--primary"
              onClick={() => void saveEdit()}
              disabled={!editName.trim() || hub.mutating === editingId}
            >
              {t('invitation.hub.guestsSheet.save')}
            </button>
          </div>
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="hub-guest-list">
          {filtered.map((g) => {
            const status = rsvpLabel(g.responseStatus, t);
            const link = invites.links[g.id];
            return (
              <div className="hub-guest-row" key={g.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="hub-guest-name">{g.name}</div>
                  {g.householdLabel ? <div className="hub-guest-meta">{g.householdLabel}</div> : null}
                  {status ? <div className="hub-guest-status">{status}</div> : null}
                  {link?.hasToken ? (
                    <div className="hub-guest-link">
                      <span className="hub-guest-link-url">{link.inviteUrl}</span>
                      <button
                        type="button"
                        className="hub-guest-link-btn"
                        onClick={() => void copyLink(g.id, link.inviteUrl)}
                      >
                        {copiedId === g.id ? (
                          <Check size={13} aria-hidden="true" />
                        ) : (
                          <Copy size={13} aria-hidden="true" />
                        )}
                        {copiedId === g.id
                          ? t('invitation.hub.guestsSheet.linksCopied')
                          : t('invitation.hub.guestsSheet.linksCopy')}
                      </button>
                      {link.whatsappLink ? (
                        <a
                          className="hub-guest-link-btn"
                          href={link.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={13} aria-hidden="true" />
                          {t('invitation.hub.guestsSheet.linksWhatsapp')}
                        </a>
                      ) : (
                        <span className="hub-guest-link-note">
                          {t('invitation.hub.guestsSheet.linksNoPhone')}
                        </span>
                      )}
                    </div>
                  ) : link ? (
                    /* Issued in an earlier session: the token was never stored in
                       the clear, so the only way back to a usable URL is to
                       reissue — for THIS guest, leaving everyone else's links
                       working. */
                    <div className="hub-guest-link">
                      <span className="hub-guest-link-note">
                        {t('invitation.hub.guestsSheet.linksSent')}
                      </span>
                      <button
                        type="button"
                        className="hub-guest-link-btn"
                        onClick={() => void invites.issue({ reissue: true, guestIds: [g.id] })}
                        disabled={invites.pending}
                        title={t('invitation.hub.guestsSheet.linksReissueHint')}
                      >
                        <RefreshCw size={13} aria-hidden="true" />
                        {t('invitation.hub.guestsSheet.linksReissue')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="hub-guest-actions">
                  <button
                    type="button"
                    className="hub-icon-btn"
                    onClick={() => startEdit(g)}
                    aria-label={t('invitation.hub.guestsSheet.editGuest')}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="hub-icon-btn hub-icon-btn--negative"
                    onClick={() => void hub.deleteGuest(g.id)}
                    disabled={hub.mutating === g.id}
                    aria-label={t('invitation.hub.guestsSheet.deleteGuest')}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hub-empty">
          {hub.guests.length > 0
            ? t('invitation.hub.guestsSheet.emptyFiltered')
            : t('invitation.hub.guestsSheet.empty')}
        </div>
      )}

      <div className="hub-field-label" style={{ marginBottom: 8 }}>
        {t('invitation.hub.guestsSheet.addTitle')}
      </div>

      {bulkMode ? (
        <>
          <textarea
            className="hub-textarea"
            style={{ marginBottom: 8 }}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.bulkHint')}
            rows={5}
          />
          <div className="hub-share-buttons" style={{ marginTop: 0 }}>
            <button type="button" className="hub-btn" onClick={() => setBulkMode(false)}>
              {t('invitation.hub.guestsSheet.cancel')}
            </button>
            <button
              type="button"
              className="hub-btn hub-btn--primary"
              onClick={() => void addBulk()}
              disabled={!bulkText.trim() || hub.mutating === 'add'}
            >
              {t('invitation.hub.guestsSheet.bulkAdd')}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            className="hub-input"
            style={{ marginBottom: 8 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.namePlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addOne();
            }}
          />
          <input
            className="hub-input"
            style={{ marginBottom: 8 }}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.phonePlaceholder')}
          />
          <input
            className="hub-input"
            style={{ marginBottom: 8 }}
            value={household}
            onChange={(e) => setHousehold(e.target.value)}
            placeholder={t('invitation.hub.guestsSheet.householdPlaceholder')}
          />
          <label className="hub-checkbox-row">
            <input
              type="checkbox"
              checked={hasPlusOne}
              onChange={(e) => setHasPlusOne(e.target.checked)}
            />
            {t('invitation.hub.guestsSheet.plusOneLabel')}
          </label>
          <div className="hub-share-buttons" style={{ marginTop: 0 }}>
            <button type="button" className="hub-btn" onClick={() => setBulkMode(true)}>
              {t('invitation.hub.guestsSheet.bulkToggle')}
            </button>
            <button
              type="button"
              className="hub-btn hub-btn--primary"
              onClick={() => void addOne()}
              disabled={!name.trim() || hub.mutating === 'add'}
            >
              {t('invitation.hub.guestsSheet.add')}
            </button>
          </div>
        </>
      )}
    </HubSheet>
  );
}
