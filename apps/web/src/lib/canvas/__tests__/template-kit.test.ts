import { describe, expect, it } from 'vitest';
import {
  buildTemplate,
  archHero,
  calendar,
  closing,
  countdown,
  dressCode,
  floatingMusic,
  greeting,
  hero,
  location,
  rsvp,
  THEMES,
  TemplateValidationError,
  type SectionEntry,
} from '../template-kit';
import { KAZAKH_INCAPABLE_FAMILIES } from '@/components/canvas/elements/fontStack';

const FULL: SectionEntry[] = [
  { key: 'hero', build: hero() },
  { key: 'greeting', build: greeting() },
  { key: 'calendar', build: calendar({ targetIso: '2027-05-15T12:00:00.000Z' }) },
  { key: 'countdown', build: countdown({ targetIso: '2027-05-15T12:00:00.000Z' }) },
  { key: 'location', build: location() },
  { key: 'dresscode', build: dressCode() },
  { key: 'rsvp', build: rsvp() },
  { key: 'closing', build: closing() },
  { key: 'music', build: floatingMusic() },
];

const ASSETS = {
  heroBg: '/assets/templates/demo/hero.jpg',
  dressCodeBg: '/assets/templates/demo/dress.jpg',
  closingBg: '/assets/templates/demo/closing.jpg',
};

describe('buildTemplate', () => {
  it('produces a document the real canvas schema accepts', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    expect(document.elements.length).toBeGreaterThan(15);
    expect(document.width).toBe(390);
  });

  it('validates every theme against every section', () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      expect(() => buildTemplate({ theme, sections: FULL, assets: ASSETS }), name).not.toThrow();
    }
  });

  it('works with no assets at all', () => {
    // Photo slots are optional; a recipe must still compose without them.
    expect(() => buildTemplate({ theme: THEMES.monoPaper, sections: FULL })).not.toThrow();
  });

  it('is deterministic — the same recipe yields identical elements', () => {
    const a = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    const b = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    expect(JSON.stringify(a.document.elements)).toBe(JSON.stringify(b.document.elements));
  });

  it('gives every element a unique id', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    const ids = document.elements.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('throws a typed error instead of returning an invalid document', () => {
    const broken: SectionEntry[] = [
      {
        key: 'broken',
        build: () => ({
          elements: [{ type: 'text', props: { x: 0, y: 0, w: 50, h: 20, color: 'not-a-color' } }],
          height: 40,
        }),
      },
    ];
    expect(() => buildTemplate({ theme: THEMES.goldIvory, sections: broken })).toThrow(
      TemplateValidationError
    );
  });
});

describe('section stacking', () => {
  it('stacks sections without overlap and reports the layout', () => {
    const { layout } = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    for (let i = 1; i < layout.length; i += 1) {
      const prev = layout[i - 1];
      expect(layout[i].top).toBe(prev.top + prev.height);
    }
  });

  it('keeps z-order increasing down the page', () => {
    // A later section's full-bleed photo must never cover an earlier
    // section's text.
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    const flow = document.elements.filter((e) => !('pinned' in e && e.pinned));
    for (let i = 1; i < flow.length; i += 1) {
      expect(flow[i].zIndex).toBeGreaterThan(flow[i - 1].zIndex);
    }
  });

  it('does not reserve vertical space for pinned elements', () => {
    const withMusic = buildTemplate({ theme: THEMES.goldIvory, sections: FULL });
    const withoutMusic = buildTemplate({
      theme: THEMES.goldIvory,
      sections: FULL.filter((s) => s.key !== 'music'),
    });
    expect(withMusic.document.height).toBe(withoutMusic.document.height);
  });
});

describe('full-bleed decoration', () => {
  it('lets photo sections run past both page edges', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, assets: ASSETS });
    const bleeding = document.elements.filter((e) => e.x < 0 && e.x + e.w > 100);
    expect(bleeding.length).toBeGreaterThan(0);
  });
});

describe('archHero composition', () => {
  const ARCH: SectionEntry[] = [{ key: 'hero', build: archHero() }, ...FULL.slice(1)];

  it('validates with and without a photo', () => {
    expect(() => buildTemplate({ theme: THEMES.goldIvory, sections: ARCH, assets: ASSETS })).not.toThrow();
    expect(() => buildTemplate({ theme: THEMES.goldIvory, sections: ARCH })).not.toThrow();
  });

  it('cuts the photograph into an arch and grades it into the palette', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: ARCH, assets: ASSETS });
    const photo = document.elements.find(
      (e) => e.type === 'image' && (e as { maskShape?: string }).maskShape === 'arch'
    ) as { grade?: { saturate?: number } } | undefined;
    expect(photo).toBeDefined();
    // A stock photo at full saturation fights the template's own colours.
    expect(photo?.grade?.saturate).toBeLessThan(100);
  });

  it('mirrors the sprig pair rather than duplicating it', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: ARCH, assets: ASSETS });
    const sprigs = document.elements.filter(
      (e) => e.type === 'ornament' && (e as { ornamentId?: string }).ornamentId === 'sprig'
    ) as Array<{ flipX?: boolean }>;
    expect(sprigs).toHaveLength(2);
    expect(sprigs.filter((s) => s.flipX).length).toBe(1);
  });

  it('layers the frame under the type', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: ARCH, assets: ASSETS });
    const frame = document.elements.find(
      (e) => (e as { ornamentId?: string }).ornamentId === 'arch-frame'
    )!;
    const names = document.elements.find((e) => e.type === 'couple-names')!;
    expect(names.zIndex).toBeGreaterThan(frame.zIndex);
  });
});

describe('document locale', () => {
  it('records the language the template was authored in', () => {
    const kz = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, locale: 'kz' });
    const ru = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, locale: 'ru' });
    expect(kz.document.locale).toBe('kz');
    expect(ru.document.locale).toBe('ru');
  });

  it('defaults to Kazakh, the product\'s primary language', () => {
    const { document } = buildTemplate({ theme: THEMES.goldIvory, sections: FULL });
    expect(document.locale).toBe('kz');
  });

  it('writes section copy in the requested language', () => {
    const kz = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, locale: 'kz' });
    const ru = buildTemplate({ theme: THEMES.goldIvory, sections: FULL, locale: 'ru' });
    const textOf = (d: typeof kz.document) =>
      d.elements.map((e) => (e as { text?: string }).text ?? '').join(' ');
    expect(textOf(kz.document)).toContain('Құрметті қонақтар!');
    expect(textOf(ru.document)).toContain('Дорогие гости!');
  });
});

describe('Kazakh safety', () => {
  it('never ships a theme font that cannot render Kazakh', () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      for (const role of ['display', 'body', 'script'] as const) {
        expect(KAZAKH_INCAPABLE_FAMILIES, `${name}.${role}`).not.toContain(theme[role]);
      }
    }
  });

  it('never emits a Kazakh-incapable font on any element', () => {
    for (const theme of Object.values(THEMES)) {
      const { document } = buildTemplate({ theme, sections: FULL, assets: ASSETS });
      for (const el of document.elements) {
        const fonts = [
          (el as { fontFamily?: string }).fontFamily,
          (el as { font?: string }).font,
        ].filter(Boolean) as string[];
        for (const f of fonts) {
          expect(KAZAKH_INCAPABLE_FAMILIES).not.toContain(f);
        }
      }
    }
  });
});
