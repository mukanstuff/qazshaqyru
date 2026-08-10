'use client';

/**
 * Editor UI mode — controls which modal (if any) is open on top of the preview.
 *
 * Lives as a separate context from the field store so opening/closing modals
 * does NOT replay history.
 *
 * Mode:
 *   - 'preview' — pure preview, no dock visible, only "Редактировать" CTA
 *   - 'edit'    — dock is visible, modal can be opened
 *
 * openModal:
 *   - null      — no modal open (only dock visible)
 *   - 'content' | 'design' | 'media' | 'publish' — floating modal centered
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { EditorTab } from './types';

type EditMode = 'preview' | 'edit';

interface EditorUiState {
  mode: EditMode;
  openModal: EditorTab | null;
  openModal_: (tab: EditorTab) => void;
  closeModal: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
}

const EditorUiContext = createContext<EditorUiState | null>(null);

export function EditorUiProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<EditMode>('preview');
  const [openModal, setOpenModal] = useState<EditorTab | null>(null);

  const value = useMemo<EditorUiState>(
    () => ({
      mode,
      openModal,
      openModal_: (tab) => {
        setMode('edit');
        setOpenModal(tab);
      },
      closeModal: () => setOpenModal(null),
      enterEditMode: () => {
        setMode('edit');
        setOpenModal(null);
      },
      exitEditMode: () => {
        setMode('preview');
        setOpenModal(null);
      },
    }),
    [mode, openModal],
  );

  return <EditorUiContext.Provider value={value}>{children}</EditorUiContext.Provider>;
}

export function useEditorUi(): EditorUiState {
  const ctx = useContext(EditorUiContext);
  if (!ctx) throw new Error('useEditorUi must be inside EditorUiProvider');
  return ctx;
}
