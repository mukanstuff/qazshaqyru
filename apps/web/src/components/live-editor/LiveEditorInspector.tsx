'use client';

import { ImagePlus } from 'lucide-react';
import type { InvitationDocument } from '@/lib/invitations/document';
import {
  fieldsForSectionType,
  readFieldValue,
  type EditorSectionField,
} from '@/lib/invitations/editor-section-fields';
import { getSectionLabel } from './section-labels';

interface Props {
  sectionType: string | null;
  sectionId: string | null;
  document: InvitationDocument;
  onFieldChange: (path: string, value: string) => void;
  onPhotoPick: (path: string) => void;
  emptyHint?: string;
}

function FieldControl({
  field,
  value,
  onFieldChange,
  onPhotoPick,
}: {
  field: EditorSectionField;
  value: string;
  onFieldChange: (path: string, value: string) => void;
  onPhotoPick: (path: string) => void;
}) {
  const { t } = useI18n();

  if (field.kind === 'photo') {
    return (
      <div className="live-editor-field">
        <span className="live-editor-field__label">{field.label}</span>
        {value ? (
          <p className="live-editor-field__hint">{t('liveEditor.inspector.photoUploaded')}</p>
        ) : (
          <p className="live-editor-field__hint">{t('liveEditor.inspector.photoEmpty')}</p>
        )}
        <button
          type="button"
          className="live-editor-photo-btn"
          onClick={() => onPhotoPick(field.path)}
          data-testid={`live-editor-inspector-photo-${field.path}`}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {value ? t('liveEditor.inspector.replacePhoto') : t('liveEditor.inspector.uploadPhoto')}
        </button>
      </div>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <label className="live-editor-field">
        <span className="live-editor-field__label">{field.label}</span>
        <textarea
          className="live-editor-field__textarea"
          value={value}
          rows={4}
          placeholder={field.placeholder}
          onChange={(e) => onFieldChange(field.path, e.target.value)}
          data-inspector-field={field.path}
          data-testid={`live-editor-inspector-${field.path}`}
        />
      </label>
    );
  }

  return (
    <label className="live-editor-field">
      <span className="live-editor-field__label">{field.label}</span>
      <input
        className="live-editor-field__input"
        type={field.kind === 'date' ? 'date' : field.kind === 'time' ? 'time' : field.kind === 'url' ? 'url' : 'text'}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onFieldChange(field.path, e.target.value)}
        data-inspector-field={field.path}
        data-testid={`live-editor-inspector-${field.path}`}
      />
    </label>
  );
}

export function LiveEditorInspector({
  sectionType,
  sectionId,
  document,
  onFieldChange,
  onPhotoPick,
  emptyHint,
}: Props) {
  const { t } = useI18n();
  const fields = sectionType ? fieldsForSectionType(sectionType) : [];
  const title = sectionType
    ? getSectionLabel(sectionType, sectionId ?? sectionType, t)
    : t('liveEditor.inspector.title');

  const resolvedEmptyHint = emptyHint || t('liveEditor.inspector.empty');

  return (
    <div className="live-editor-inspector" data-testid="live-editor-inspector">
      <h2 className="live-editor-inspector__title">{title}</h2>
      {!sectionType ? (
        <p className="live-editor-inspector__empty">{resolvedEmptyHint}</p>
      ) : fields.length === 0 ? (
        <p className="live-editor-inspector__empty">
          {t('liveEditor.inspector.noFields')}
        </p>
      ) : (
        fields.map((field) => (
          <FieldControl
            key={field.path}
            field={field}
            value={readFieldValue(document, field.path)}
            onFieldChange={onFieldChange}
            onPhotoPick={onPhotoPick}
          />
        ))
      )}
    </div>
  );
}
