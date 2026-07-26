import { describe, expect, it } from 'vitest';
import { instantiateInvitationDocument } from '@/lib/templates/instantiate-document';
import { WIRING_STUB_MANIFEST } from '@/lib/templates/manifests/wiring-stub';
import { applyEditorAction } from '@/lib/invitations/editor-store';
import { visibleSectionsForRender } from '@/lib/invitations/document-state';

describe('editor-store section actions', () => {
  it('hides section and persists order', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST);
    const hidden = applyEditorAction(doc, {
      type: 'setSectionVisible',
      sectionId: 'cover-photo',
      visible: false,
    });
    expect(hidden.sections.find((s) => s.id === 'cover-photo')?.visible).toBe(false);
    expect(visibleSectionsForRender(hidden.sections).map((s) => s.id)).not.toContain(
      'cover-photo',
    );
    expect(hidden.templateData.__documentState).toBeTruthy();
  });

  it('reorders sections by ordered ids', () => {
    const doc = instantiateInvitationDocument(WIRING_STUB_MANIFEST);
    const reordered = applyEditorAction(doc, {
      type: 'reorderSections',
      orderedIds: ['body-invitation', 'hero-names', 'cover-photo'],
    });
    expect(reordered.sections.sort((a, b) => a.order - b.order).map((s) => s.id)).toEqual([
      'body-invitation',
      'hero-names',
      'cover-photo',
    ]);
  });
});
