import { describe, expect, it } from 'vitest';
import {
  documentToInvitationData,
  localDraftToDocument,
} from '@/lib/invitations/document';
import { parseInvitationDocument, safeParseInvitationDocument } from '@/lib/invitations/document-schema';
import {
  DOCUMENT_STATE_KEY,
  readDocumentState,
  visibleSectionsForRender,
  writeDocumentState,
} from '@/lib/invitations/document-state';
import { instantiateInvitationDocument } from '@/lib/templates/instantiate-document';
import { getTemplateManifest } from '@/lib/templates/manifests';
import { WIRING_STUB_MANIFEST } from '@/lib/templates/manifests/wiring-stub';
import { ALL_TEMPLATE_SLUGS } from '@/lib/templates/helpers';
import { isCatalogTemplateSlug } from '@/lib/templates/catalog';

describe('InvitationDocument schema', () => {
  it('roundtrips instantiate → parse', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST, { locale: 'ru' });
    expect(doc.schemaVersion).toBe(1);
    const parsed = parseInvitationDocument(doc);
    expect(parsed.meta.templateKey).toBe('wiring-stub');
    expect(parsed.sections.map((s) => s.id)).toEqual([
      'hero-names',
      'cover-photo',
      'body-invitation',
    ]);
  });

  it('rejects wrong schemaVersion', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST);
    const bad = { ...doc, schemaVersion: 2 };
    expect(safeParseInvitationDocument(bad).success).toBe(false);
  });
});

describe('instantiateInvitationDocument', () => {
  it('builds document from contract with defaults + __documentState', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST, {
      templateId: 'tpl-1',
      locale: 'kz',
    });
    expect(doc.meta.templateId).toBe('tpl-1');
    expect(doc.meta.language).toBe('kz');
    expect(doc.sections.every((s) => s.visible)).toBe(true);
    expect(doc.templateData[DOCUMENT_STATE_KEY]).toBeTruthy();
    const state = readDocumentState(doc.templateData);
    expect(state?.schemaVersion).toBe(1);
    expect(state?.sections?.length).toBe(3);
  });

  it('guest DTO parity after field edit', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST, { locale: 'ru' });
    const updated = {
      ...doc,
      customText: { ...doc.customText, groomName: 'Дастан' },
      fields: doc.fields.map((f) =>
        f.id === 'customText.groomName' ? { ...f, value: 'Дастан' } : f,
      ),
    };
    const dto = documentToInvitationData(updated);
    expect(dto.customText?.groomName).toBe('Дастан');
    expect(dto.templateKey).toBe('wiring-stub');
  });
});

describe('section hide / reorder → renderer input', () => {
  it('hides and reorders sections for render', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST);
    const reordered = doc.sections.map((section) => {
      if (section.id === 'cover-photo') return { ...section, visible: false };
      if (section.id === 'body-invitation') return { ...section, order: 0 };
      if (section.id === 'hero-names') return { ...section, order: 2 };
      return section;
    });
    const visible = visibleSectionsForRender(reordered);
    expect(visible.map((s) => s.id)).toEqual(['body-invitation', 'hero-names']);
  });

  it('localDraftToDocument restores visibility from __documentState', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST);
    const templateData = writeDocumentState(doc.templateData, {
      schemaVersion: 1,
      sections: [
        { id: 'hero-names', visible: true, order: 0 },
        { id: 'cover-photo', visible: false, order: 1 },
        { id: 'body-invitation', visible: true, order: 2 },
      ],
    });
    const draft = {
      ...documentToInvitationData(doc),
      templateData,
      templateId: 'tpl',
      guests: [] as [],
      updatedAt: new Date().toISOString(),
      eventTimezone: doc.meta.eventTimezone,
      language: doc.meta.language as 'kz' | 'ru',
    };
    // localDraft shape
    const restored = localDraftToDocument({
      templateKey: draft.templateKey,
      templateId: 'tpl',
      title: draft.title,
      eventType: draft.eventType,
      eventDate: draft.eventDate,
      eventTime: draft.eventTime,
      eventPlace: draft.eventPlace,
      address: draft.address,
      mapUrl: draft.mapUrl,
      musicUrl: draft.musicUrl,
      templateData,
      customText: (draft.customText ?? {}) as Record<string, unknown>,
      guests: [],
      eventTimezone: draft.eventTimezone,
      language: draft.language,
      updatedAt: new Date().toISOString(),
    });
    expect(restored.sections.find((s) => s.id === 'cover-photo')?.visible).toBe(false);
    expect(visibleSectionsForRender(restored.sections).map((s) => s.id)).toEqual([
      'hero-names',
      'body-invitation',
    ]);
  });
});

describe('wiring-stub template contract', () => {
  it('registers via standard manifests index', () => {
    const manifest = getTemplateManifest('wiring-stub');
    expect(manifest).not.toBeNull();
    expect(manifest?.renderEngine).toBe('react-sections');
    expect(manifest?.sections.every((s) => Boolean(s.id))).toBe(true);
  });

  it('resolves slug in TEMPLATE_CONFIGS but not sales catalog', () => {
    expect(ALL_TEMPLATE_SLUGS).toContain('wiring-stub');
    expect(isCatalogTemplateSlug('wiring-stub')).toBe(false);
  });

  it('instantiate → section list without core hacks', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST);
    expect(doc.sections.map((s) => s.type)).toEqual([
      'hero-names',
      'cover-photo',
      'body-invitation',
    ]);
  });
});

describe('wedding-luxury bridge contract', () => {
  it('has react-sections engine and stable section ids', () => {
    const manifest = getTemplateManifest('wedding-luxury');
    expect(manifest?.renderEngine).toBe('react-sections');
    expect(manifest?.sections[0]?.id).toBeTruthy();
  });
});
