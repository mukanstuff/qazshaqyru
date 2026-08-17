'use client';

import { useState } from 'react';
import {
  sectionsFromDoc,
  type EditorSection,
  type SectionSummary,
} from './ElementSettingsConfig';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

/**
 * 2026-08-17 (pilot-2): bottom floating island — sections quick-access.
 *
 * Tapping a section ID does NOT open a list. It activates a highlight
 * mode: every element on the canvas that matches the section gets a
 * pulsing emerald outline. Tap a highlighted element → its settings card
 * opens. Tap the same section again (or the ✕ button) to deactivate.
 *
 * Why highlight-not-list: long text strings on phones are unreadable in
 * a vertical scroll. Highlight gives instant visual confirmation of
 * which blocks the section covers (the same trick Canva/Figma use).
 *
 * Sections that aren't present in the document are hidden from the island
 * — see `sectionsFromDoc`. So the island shrinks/grows with the template.
 */
interface Props {
  document: InvitationCanvasDocument;
  /** Element IDs that should pulse right now (set by parent when activeSection is set). */
  highlightedIds: string[];
  /** Currently active section ID, or null. */
  activeSectionId: string | null;
  onActivate: (sectionId: string) => void;
  onClear: () => void;
}

export function ElementSectionsBottomIsland({
  document,
  highlightedIds,
  activeSectionId,
  onActivate,
  onClear,
}: Props) {
  const summaries = sectionsFromDoc(document);
  const active = activeSectionId
    ? summaries.find((s) => s.section.id === activeSectionId) ?? null
    : null;

  return (
    <div
      className={`editor-bottom-island ${active ? 'is-expanded' : ''}`}
      role="toolbar"
      aria-label="Разделы"
    >
      {active && (
        <button
          type="button"
          className="editor-island-clear"
          onClick={onClear}
          aria-label="Снять подсветку"
          title="Снять подсветку"
        >
          ✕
        </button>
      )}

      <div className="editor-island-buttons">
        {summaries.map((s) => (
          <SectionChip
            key={s.section.id}
            summary={s}
            active={activeSectionId === s.section.id}
            onClick={() => onActivate(s.section.id)}
          />
        ))}
      </div>

      {active && (
        <div className="editor-island-active-label">
          <strong>{active.section.label}</strong>
          <span> · {active.elements.length}</span>
        </div>
      )}
    </div>
  );
}

interface ChipProps {
  summary: SectionSummary;
  active: boolean;
  onClick: () => void;
}

function SectionChip({ summary, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`editor-island-chip ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
      title={summary.section.label}
    >
      <span className="editor-island-chip-icon">{summary.section.icon}</span>
      <span className="editor-island-chip-count">{summary.elements.length}</span>
    </button>
  );
}

/**
 * CSS class applied to every element that should pulse in highlight mode.
 * Rendered by the CanvasEditor's selection chrome / element wrapper
 * when the section's element IDs are in the highlighted set.
 */
export const HIGHLIGHT_CLASS = 'editor-highlight-pulse';

/**
 * Pure helper used by CanvasEditor to compute the list of element IDs to
 * highlight for an active section. Kept here so the island and the editor
 * share the same source of truth.
 */
export function highlightedIdsForSection(
  document: InvitationCanvasDocument,
  sectionId: string | null,
): string[] {
  if (!sectionId) return [];
  const summary = sectionsFromDoc(document).find((s) => s.section.id === sectionId);
  if (!summary) return [];
  return summary.elements.map((e) => e.id);
}

export type { EditorSection };
