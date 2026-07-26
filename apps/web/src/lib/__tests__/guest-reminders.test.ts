import { describe, it, expect } from 'vitest';
import {
  isReminderTarget,
  filterReminderGuests,
  buildReminderMessage,
  buildGuestReminderLinks,
  formatReminderLinksForClipboard,
} from '@/lib/guests/guest-reminders';

describe('guest-reminders', () => {
  it('targets guests without response or with pending/not_attending', () => {
    expect(isReminderTarget(null)).toBe(true);
    expect(isReminderTarget('pending')).toBe(true);
    expect(isReminderTarget('not_attending')).toBe(true);
    expect(isReminderTarget('attending')).toBe(false);
    expect(isReminderTarget('attending_plus_one')).toBe(false);
    expect(isReminderTarget('attending_no_children')).toBe(false);
  });

  it('filters reminder guests', () => {
    const guests = [
      { id: '1', name: 'A', phone: '+77001111111', responseStatus: null },
      { id: '2', name: 'B', phone: '+77002222222', responseStatus: 'attending' as const },
      { id: '3', name: 'C', phone: null, responseStatus: 'not_attending' as const },
    ];
    const filtered = filterReminderGuests(guests);
    expect(filtered.map((g) => g.id)).toEqual(['1', '3']);
  });

  it('builds localized reminder messages', () => {
    const ru = buildReminderMessage('ru', 'Той Асет', 'https://example.com/i/test');
    expect(ru).toContain('Той Асет');
    expect(ru).toContain('https://example.com/i/test');

    const kz = buildReminderMessage('kz', 'Той', 'https://example.com/i/test');
    expect(kz).toContain('Еске салу');
  });

  it('builds WhatsApp links for guests with phone', () => {
    const links = buildGuestReminderLinks({
      guests: [
        { id: '1', name: 'Guest', phone: '77001234567', token: 'abc' },
      ],
      slug: 'test-slug',
      title: 'My Event',
      baseUrl: 'https://example.com',
      locale: 'ru',
      openRsvp: false,
    });
    expect(links).toHaveLength(1);
    expect(links[0].inviteUrl).toContain('guest=abc');
    expect(links[0].whatsappLink).toMatch(/^https:\/\/wa\.me\/77001234567\?text=/);
  });

  it('uses public URL for open RSVP', () => {
    const links = buildGuestReminderLinks({
      guests: [{ id: '1', name: 'G', phone: '77001234567', token: 'tok' }],
      slug: 'open',
      title: 'Event',
      baseUrl: 'https://example.com',
      locale: 'ru',
      openRsvp: true,
    });
    expect(links[0].inviteUrl).toBe('https://example.com/i/open');
  });

  it('formats clipboard text for batch reminders', () => {
    const text = formatReminderLinksForClipboard([
      {
        id: '1',
        name: 'Ali',
        phone: '7700',
        inviteUrl: 'https://x.com',
        whatsappLink: 'https://wa.me/7700?text=hi',
      },
    ]);
    expect(text).toContain('Ali:');
    expect(text).toContain('wa.me');
  });
});
