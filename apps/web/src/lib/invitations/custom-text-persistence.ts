/**
 * Maps customText patches from EditorToolbar to onFieldChange calls.
 * Prevents silent data loss when only openRsvp was persisted.
 */

export function serializeCustomTextFieldValue(key: string, value: unknown): string {
  if (key === 'openRsvp') {
    return value === true || value === 'true' ? 'true' : 'false';
  }
  if (key === 'program') {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export type CustomTextPersistenceAction = {
  field: string;
  value: string;
};

/** Returns onFieldChange actions for keys that changed between prev and next customText. */
export function getCustomTextPersistenceActions(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): CustomTextPersistenceAction[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const actions: CustomTextPersistenceAction[] = [];

  for (const key of keys) {
    const prevVal = prev[key];
    const nextVal = next[key];
    if (JSON.stringify(prevVal) === JSON.stringify(nextVal)) {
      continue;
    }
    actions.push({
      field: `customText.${key}`,
      value: serializeCustomTextFieldValue(key, nextVal),
    });
  }

  return actions;
}
