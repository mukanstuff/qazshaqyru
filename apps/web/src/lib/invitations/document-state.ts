import type { InvitationDocument, InvitationDocumentSection } from '@/lib/invitations/document';
import type { TemplateManifest } from '@/lib/templates/manifest-types';

export const DOCUMENT_STATE_KEY = '__documentState' as const;

export interface DocumentStatePayload {
  schemaVersion: 1;
  sections?: Array<{
    id: string;
    visible?: boolean;
    order?: number;
  }>;
  theme?: InvitationDocument['theme'];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readDocumentState(
  templateData: Record<string, unknown> | undefined | null,
): DocumentStatePayload | null {
  if (!templateData) return null;
  const raw = templateData[DOCUMENT_STATE_KEY];
  if (!isRecord(raw)) return null;
  if (raw.schemaVersion !== 1) return null;

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .filter(isRecord)
        .map((item) => ({
          id: String(item.id ?? ''),
          visible: typeof item.visible === 'boolean' ? item.visible : undefined,
          order: typeof item.order === 'number' ? item.order : undefined,
        }))
        .filter((item) => item.id.length > 0)
    : undefined;

  const theme = isRecord(raw.theme)
    ? ({
        accent: String(raw.theme.accent ?? ''),
        textLight: String(raw.theme.textLight ?? ''),
        textDark: String(raw.theme.textDark ?? ''),
        fonts: isRecord(raw.theme.fonts)
          ? {
              display: String(raw.theme.fonts.display ?? ''),
              body: String(raw.theme.fonts.body ?? ''),
              label:
                raw.theme.fonts.label != null ? String(raw.theme.fonts.label) : undefined,
              ceremonial:
                raw.theme.fonts.ceremonial != null
                  ? String(raw.theme.fonts.ceremonial)
                  : undefined,
            }
          : { display: '', body: '' },
      } satisfies NonNullable<InvitationDocument['theme']>)
    : undefined;

  return {
    schemaVersion: 1,
    sections,
    theme: theme?.accent ? theme : undefined,
  };
}

export function writeDocumentState(
  templateData: Record<string, unknown>,
  state: DocumentStatePayload,
): Record<string, unknown> {
  return {
    ...templateData,
    [DOCUMENT_STATE_KEY]: {
      schemaVersion: 1 as const,
      ...(state.sections ? { sections: state.sections } : {}),
      ...(state.theme ? { theme: state.theme } : {}),
    },
  };
}

export function documentStateFromSections(
  sections: InvitationDocumentSection[],
  theme?: InvitationDocument['theme'],
): DocumentStatePayload {
  return {
    schemaVersion: 1,
    sections: sections.map((section) => ({
      id: section.id,
      visible: section.visible,
      order: section.order,
    })),
    theme,
  };
}

export function syncDocumentStateIntoTemplateData(
  document: InvitationDocument,
): InvitationDocument {
  const templateData = writeDocumentState(
    document.templateData,
    documentStateFromSections(document.sections, document.theme),
  );
  return { ...document, templateData };
}

/** Build sections from manifest, applying optional __documentState overrides. */
export function resolveSectionsFromManifest(
  manifest: TemplateManifest,
  templateData?: Record<string, unknown> | null,
): InvitationDocumentSection[] {
  const saved = readDocumentState(templateData);
  const base = manifest.sections.map((section, index) => ({
    id: section.id,
    type: section.type,
    visible: section.defaultVisible !== false,
    order: index,
    canHide: section.canHide !== false,
    canReorder: section.canReorder === true,
    bindings: section.fieldBindings ?? {},
    props: section.props,
  }));

  if (!saved?.sections?.length) {
    return base;
  }

  const overrideById = new Map(saved.sections.map((item) => [item.id, item]));
  const merged = base.map((section) => {
    const override = overrideById.get(section.id);
    if (!override) return section;
    return {
      ...section,
      visible: override.visible ?? section.visible,
      order: override.order ?? section.order,
    };
  });

  return [...merged].sort((a, b) => a.order - b.order);
}

/** Visible sections sorted by order — input for SectionRenderer. */
export function visibleSectionsForRender(
  sections: InvitationDocumentSection[],
): InvitationDocumentSection[] {
  return [...sections]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);
}
