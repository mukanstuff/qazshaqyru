import type { GuidedFlowAction } from '@/lib/shared/ux-guided-flow';

export type EditorGuidedAction = GuidedFlowAction;

export const EDITOR_GUIDED_EVENT = 'qazshaqyru:editor-guided-action';

export function dispatchEditorGuidedAction(action: EditorGuidedAction): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<EditorGuidedAction>(EDITOR_GUIDED_EVENT, { detail: action }));
}

export function subscribeEditorGuidedAction(handler: (action: EditorGuidedAction) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<EditorGuidedAction>;
    if (custom.detail) handler(custom.detail);
  };

  window.addEventListener(EDITOR_GUIDED_EVENT, listener);
  return () => window.removeEventListener(EDITOR_GUIDED_EVENT, listener);
}
