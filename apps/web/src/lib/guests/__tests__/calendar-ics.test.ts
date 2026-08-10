import { describe, expect, it } from 'vitest';
import { buildIcsContent } from '../calendar-ics';

const baseEvent = new Date('2026-12-12T00:00:00.000Z');

describe('calendar-ics', () => {
  describe('when eventTimezone is supplied', () => {
    it('emits DTSTART in the correct TZID wall-clock time', () => {
      const ics = buildIcsContent({
        title: 'Aylın & Daniyar',
        eventDate: baseEvent,
        eventTime: '18:00',
        eventTimezone: 'Asia/Almaty',
        eventPlace: 'Almaty',
        slug: 'aylin-daniyar',
        appUrl: 'https://example.com',
      });

      // Asia/Almaty is UTC+5 year-round, so 18:00 local = 13:00 UTC.
      // Wall clock 18:00 must be the displayed time, the Z-UTC 13:00
      // the time a different-tz client can re-derive. Hard-pin both.
      expect(ics).toContain('DTSTART;TZID=Asia/Almaty:20261212T180000');
      expect(ics).toContain('DTEND;TZID=Asia/Almaty:20261212T210000');
      // UTC instant must reflect +05:00 offset.
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    });

    it('falls back to UTC when eventTimezone is unknown', () => {
      const ics = buildIcsContent({
        title: 'Test',
        eventDate: baseEvent,
        eventTime: '18:00',
        eventTimezone: 'Mars/Olympus_Mons',
        slug: 'test',
      });

      // No TZID; emit UTC instant.
      expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
      expect(ics).not.toMatch(/DTSTART;TZID=/);
    });

    it('defaults to Asia/Almaty when eventTimezone is missing', () => {
      const ics = buildIcsContent({
        title: 'Test',
        eventDate: baseEvent,
        eventTime: '18:00',
        slug: 'test',
      });

      expect(ics).toContain('DTSTART;TZID=Asia/Almaty:20261212T180000');
    });

    it('uses 12:00 noon when eventTime is absent', () => {
      const ics = buildIcsContent({
        title: 'Test',
        eventDate: baseEvent,
        eventTimezone: 'Asia/Almaty',
        slug: 'test',
      });

      expect(ics).toContain('DTSTART;TZID=Asia/Almaty:20261212T120000');
    });
  });

  describe('regression — host timezone must not leak into the event wall-clock time', () => {
    it('18:00 Asia/Almaty produces the same DTSTART regardless of host TZ', () => {
      const beforeTZ = process.env.TZ;
      try {
        process.env.TZ = 'America/Los_Angeles';
        const west = buildIcsContent({
          title: 'X',
          eventDate: baseEvent,
          eventTime: '18:00',
          eventTimezone: 'Asia/Almaty',
          slug: 'x',
        });

        process.env.TZ = 'Asia/Tokyo';
        const east = buildIcsContent({
          title: 'X',
          eventDate: baseEvent,
          eventTime: '18:00',
          eventTimezone: 'Asia/Almaty',
          slug: 'x',
        });

        // Same wall-clock time, same TZID, same UTC instant.
        expect(west).toContain('DTSTART;TZID=Asia/Almaty:20261212T180000');
        expect(east).toContain('DTSTART;TZID=Asia/Almaty:20261212T180000');
      } finally {
        if (beforeTZ === undefined) delete process.env.TZ;
        else process.env.TZ = beforeTZ;
      }
    });
  });
});
