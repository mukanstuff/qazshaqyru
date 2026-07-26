import { describe, expect, it } from 'vitest';
import {
  computeConfirmedHeadcount,
  computeExpectedHeadcount,
  groupHouseholds,
  seatsForRsvpStatus,
} from '@/lib/guests/headcount';
import { buildBanquetExportCsv } from '@/lib/guests/restaurant-export';
import { shouldShowPublishWatermark } from '@/lib/invitations/publish-watermark';
import { buildAiFillFallback, fillInvitationFields } from '@/lib/ai/fill-invitation';

describe('headcount', () => {
  it('counts plus-one as two seats', () => {
    expect(seatsForRsvpStatus('attending_plus_one', true)).toBe(2);
    expect(seatsForRsvpStatus('attending_plus_one', false)).toBe(1);
    expect(seatsForRsvpStatus('pending')).toBe(0);
    expect(seatsForRsvpStatus('not_attending')).toBe(0);
  });

  it('aggregates confirmed and expected headcount', () => {
    const guests = [
      { id: '1', name: 'A', responseStatus: 'attending', hasPlusOne: false },
      { id: '2', name: 'B', responseStatus: 'attending_plus_one', hasPlusOne: true },
      { id: '3', name: 'C', responseStatus: 'pending', hasPlusOne: true },
      { id: '4', name: 'D', responseStatus: 'not_attending', hasPlusOne: false },
    ];
    expect(computeConfirmedHeadcount(guests)).toBe(3);
    expect(computeExpectedHeadcount(guests)).toBe(5);
  });

  it('groups households', () => {
    const groups = groupHouseholds([
      { id: '1', name: 'Aset', householdLabel: 'Семья Асетовых', responseStatus: 'attending' },
      { id: '2', name: 'Aigerim', householdLabel: 'Семья Асетовых', responseStatus: 'attending' },
      { id: '3', name: 'Solo', responseStatus: 'pending' },
    ]);
    expect(groups).toHaveLength(2);
    const family = groups.find((g) => g.label === 'Семья Асетовых');
    expect(family?.seats).toBe(2);
    expect(family?.guestIds).toHaveLength(2);
  });
});

describe('banquet export', () => {
  it('includes summary seats and table column', () => {
    const csv = buildBanquetExportCsv('Той', [
      {
        id: '1',
        name: 'Асет',
        householdLabel: 'Асетовы',
        responseStatus: 'attending_plus_one',
        hasPlusOne: true,
        tableName: 'Стол 1',
        dietary: 'без глютена',
      },
    ]);
    expect(csv).toContain('confirmed_seats=2');
    expect(csv).toContain('Стол 1');
    expect(csv).toContain('без глютена');
  });
});

describe('publish watermark', () => {
  it('shows watermark when unpaid', () => {
    expect(shouldShowPublishWatermark({ priceKzt: 3990, hasPaidOrder: false })).toBe(true);
    expect(shouldShowPublishWatermark({ priceKzt: 3990, hasPaidOrder: true })).toBe(false);
    expect(shouldShowPublishWatermark({ priceKzt: 0, hasPaidOrder: false })).toBe(true);
  });

  it('respects entitlements.watermark when provided', () => {
    expect(
      shouldShowPublishWatermark({
        priceKzt: 3990,
        hasPaidOrder: false,
        entitlements: { watermark: false },
      }),
    ).toBe(false);
  });
});

describe('ai fill', () => {
  it('builds offline fallback texts with hosts + rsvp intro', () => {
    const data = buildAiFillFallback({
      eventType: 'wedding',
      names: 'Асет & Айым',
      tone: 'warm',
      language: 'both',
    });
    expect(data.bodyRu).toContain('Асет');
    expect(data.bodyKz).toContain('Асет');
    expect(data.hostsLine).toContain('Асет');
    expect(data.rsvpIntro).toBeTruthy();
    expect(data.program?.length).toBeGreaterThan(0);
  });

  it('uses fallback when no API key', async () => {
    const result = await fillInvitationFields(
      { eventType: 'wedding', names: 'Test', tone: 'formal', language: 'ru' },
      {}
    );
    expect(result.source).toBe('fallback');
    expect(result.data.bodyRu).toBeTruthy();
  });
});
