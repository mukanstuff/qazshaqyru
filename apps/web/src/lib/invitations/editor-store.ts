import { useCallback, useMemo, useReducer } from 'react';

import type { InvitationDocument, InvitationDocumentGuest } from '@/lib/invitations/document';
import { syncDocumentStateIntoTemplateData } from '@/lib/invitations/document-state';

export type InvitationSyncStatus = 'LOCAL_DRAFT' | 'SYNCED_ACCOUNT' | 'PUBLISHED';

interface InvitationEditorState {
  document: InvitationDocument;
  syncStatus: InvitationSyncStatus;
}

type InvitationEditorAction =
  | { type: 'loadDocument'; document: InvitationDocument; syncStatus?: InvitationSyncStatus }
  | { type: 'updateField'; fieldId: string; value: unknown }
  | { type: 'replaceTemplateData'; templateData: Record<string, unknown>; templateKey?: string }
  | { type: 'replaceCustomText'; customText: Record<string, unknown> }
  | { type: 'setMeta'; patch: Partial<InvitationDocument['meta']> }
  | { type: 'setGuests'; guests: InvitationDocumentGuest[] }
  | { type: 'setSectionVisible'; sectionId: string; visible: boolean }
  | { type: 'reorderSections'; orderedIds: string[] }
  | { type: 'markPublished' }
  | { type: 'syncStatusChanged'; status: InvitationSyncStatus };

function replaceFieldValue(
  fields: InvitationDocument['fields'],
  fieldId: string,
  value: unknown,
): InvitationDocument['fields'] {
  const existing = fields.find((field) => field.id === fieldId);
  if (!existing) {
    return [
      ...fields,
      {
        id: fieldId,
        type: 'text',
        value,
        binding: fieldId,
      },
    ];
  }

  return fields.map((field) => (field.id === fieldId ? { ...field, value } : field));
}

function withSyncedState(document: InvitationDocument): InvitationDocument {
  return syncDocumentStateIntoTemplateData(document);
}

function invitationEditorReducer(
  state: InvitationEditorState,
  action: InvitationEditorAction,
): InvitationEditorState {
  switch (action.type) {
    case 'loadDocument':
      return {
        document: action.document,
        syncStatus: action.syncStatus ?? state.syncStatus,
      };
    case 'updateField': {
      if (action.fieldId.startsWith('customText.')) {
        const key = action.fieldId.replace('customText.', '');
        return {
          ...state,
          document: {
            ...state.document,
            customText: {
              ...state.document.customText,
              [key]: action.value,
            },
            fields: replaceFieldValue(state.document.fields, action.fieldId, action.value),
          },
        };
      }

      if (action.fieldId.startsWith('templateData.')) {
        const key = action.fieldId.replace('templateData.', '');
        return {
          ...state,
          document: {
            ...state.document,
            templateData: {
              ...state.document.templateData,
              [key]: action.value,
            },
            fields: replaceFieldValue(state.document.fields, action.fieldId, action.value),
          },
        };
      }

      return {
        ...state,
        document: {
          ...state.document,
          meta: {
            ...state.document.meta,
            [action.fieldId]: action.value,
          },
          fields: replaceFieldValue(state.document.fields, action.fieldId, action.value),
        },
      };
    }
    case 'replaceTemplateData':
      return {
        ...state,
        document: {
          ...state.document,
          meta: {
            ...state.document.meta,
            ...(action.templateKey ? { templateKey: action.templateKey } : {}),
          },
          templateData: action.templateData,
        },
      };
    case 'replaceCustomText':
      return {
        ...state,
        document: {
          ...state.document,
          customText: action.customText,
        },
      };
    case 'setMeta':
      return {
        ...state,
        document: {
          ...state.document,
          meta: {
            ...state.document.meta,
            ...action.patch,
          },
        },
      };
    case 'setGuests':
      return {
        ...state,
        document: {
          ...state.document,
          guests: action.guests,
        },
      };
    case 'setSectionVisible': {
      const sections = state.document.sections.map((section) => {
        if (section.id !== action.sectionId) return section;
        if (!section.canHide && !action.visible) return section;
        return { ...section, visible: action.visible };
      });
      return {
        ...state,
        document: withSyncedState({ ...state.document, sections }),
      };
    }
    case 'reorderSections': {
      const byId = new Map(state.document.sections.map((section) => [section.id, section]));
      const ordered: InvitationDocument['sections'] = [];
      action.orderedIds.forEach((id, index) => {
        const section = byId.get(id);
        if (!section) return;
        ordered.push({ ...section, order: index });
        byId.delete(id);
      });
      // Keep any sections missing from orderedIds at the end
      for (const section of byId.values()) {
        ordered.push({ ...section, order: ordered.length });
      }
      return {
        ...state,
        document: withSyncedState({ ...state.document, sections: ordered }),
      };
    }
    case 'markPublished':
      return {
        syncStatus: 'PUBLISHED',
        document: {
          ...state.document,
          meta: {
            ...state.document.meta,
            status: 'published',
          },
        },
      };
    case 'syncStatusChanged':
      return {
        ...state,
        syncStatus: action.status,
      };
    default:
      return state;
  }
}

function inferInitialStatus(document: InvitationDocument): InvitationSyncStatus {
  if (document.meta.status === 'published') return 'PUBLISHED';
  if (document.meta.id !== 'draft') return 'SYNCED_ACCOUNT';
  return 'LOCAL_DRAFT';
}

/**
 * Headless editor store — document is source of truth for Live Editor.
 */
export function useInvitationEditorStore(initialDocument: InvitationDocument) {
  const [state, dispatch] = useReducer(invitationEditorReducer, {
    document: initialDocument,
    syncStatus: inferInitialStatus(initialDocument),
  });

  const actions = useMemo(
    () => ({
      loadDocument: (document: InvitationDocument, syncStatus?: InvitationSyncStatus) =>
        dispatch({ type: 'loadDocument', document, syncStatus }),
      updateField: (fieldId: string, value: unknown) =>
        dispatch({ type: 'updateField', fieldId, value }),
      replaceTemplateData: (templateData: Record<string, unknown>, templateKey?: string) =>
        dispatch({ type: 'replaceTemplateData', templateData, templateKey }),
      replaceCustomText: (customText: Record<string, unknown>) =>
        dispatch({ type: 'replaceCustomText', customText }),
      setMeta: (patch: Partial<InvitationDocument['meta']>) => dispatch({ type: 'setMeta', patch }),
      setGuests: (guests: InvitationDocumentGuest[]) => dispatch({ type: 'setGuests', guests }),
      setSectionVisible: (sectionId: string, visible: boolean) =>
        dispatch({ type: 'setSectionVisible', sectionId, visible }),
      reorderSections: (orderedIds: string[]) =>
        dispatch({ type: 'reorderSections', orderedIds }),
      markPublished: () => dispatch({ type: 'markPublished' }),
      syncStatusChanged: (status: InvitationSyncStatus) =>
        dispatch({ type: 'syncStatusChanged', status }),
    }),
    [],
  );

  const moveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      const sorted = [...state.document.sections].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((section) => section.id === sectionId);
      if (index < 0) return;
      const target = index + direction;
      if (target < 0 || target >= sorted.length) return;
      const next = [...sorted];
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      actions.reorderSections(next.map((section) => section.id));
    },
    [actions, state.document.sections],
  );

  const setThemeVariant = useCallback(
    (templateKey: string, templateData: Record<string, unknown>) => {
      actions.replaceTemplateData(templateData, templateKey);
    },
    [actions],
  );

  return {
    state,
    document: state.document,
    syncStatus: state.syncStatus,
    actions: {
      ...actions,
      moveSection,
      setThemeVariant,
    },
  };
}

/** Pure reducer export for unit tests. */
export function applyEditorAction(
  document: InvitationDocument,
  action: InvitationEditorAction,
): InvitationDocument {
  return invitationEditorReducer(
    { document, syncStatus: 'LOCAL_DRAFT' },
    action,
  ).document;
}
