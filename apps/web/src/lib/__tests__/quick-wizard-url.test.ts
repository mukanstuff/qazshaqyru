import { describe, it, expect } from 'vitest';
import { editorHref } from '@/lib/shared/quick-wizard-url';

/**
 * This file used to assert the opposite of what the product needs: that the
 * builders default to `luxe-gold` when called with no slug. `luxe-gold` has no
 * row in the Template table, so those assertions pinned a bug in place — "call
 * me with nothing and I'll hand you a link to a page that 404s". The slug is
 * now required.
 *
 * `quickWizardHref` is gone with the `/preview/<slug>` route: the catalog goes
 * straight into the editor.
 */
describe('editorHref', () => {
  it('builds an editor href from a template slug', () => {
    expect(editorHref('elegant-gold-wedding-01')).toBe('/editor/elegant-gold-wedding-01');
  });

  it('encodes special characters in the slug', () => {
    expect(editorHref('toy & family')).toBe(`/editor/${encodeURIComponent('toy & family')}`);
  });
});
