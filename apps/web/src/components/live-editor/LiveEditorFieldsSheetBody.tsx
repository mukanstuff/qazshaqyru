'use client';

import { ImagePlus } from 'lucide-react';

interface Props {
  groomName: string;
  brideName: string;
  eventDate?: string;
  eventTime?: string;
  eventPlace?: string;
  onFieldChange: (field: string, value: string) => void;
  onCoverPhoto: () => void;
}

export function LiveEditorFieldsSheetBody({
  groomName,
  brideName,
  eventDate = '',
  eventTime = '',
  eventPlace = '',
  onFieldChange,
  onCoverPhoto,
}: Props) {
  return (
    <div>
      <label className="live-editor-field">
        <span className="live-editor-field__label">Жених</span>
        <input
          className="live-editor-field__input"
          value={groomName}
          onChange={(e) => onFieldChange('customText.groomName', e.target.value)}
          data-testid="live-editor-field-groom"
        />
      </label>
      <label className="live-editor-field">
        <span className="live-editor-field__label">Невеста</span>
        <input
          className="live-editor-field__input"
          value={brideName}
          onChange={(e) => onFieldChange('customText.brideName', e.target.value)}
          data-testid="live-editor-field-bride"
        />
      </label>
      <label className="live-editor-field">
        <span className="live-editor-field__label">Дата</span>
        <input
          className="live-editor-field__input"
          type="date"
          value={eventDate}
          onChange={(e) => {
            const iso = e.target.value
              ? new Date(`${e.target.value}T12:00:00`).toISOString()
              : '';
            onFieldChange('eventDate', iso);
          }}
          data-testid="live-editor-field-date"
        />
      </label>
      <label className="live-editor-field">
        <span className="live-editor-field__label">Время</span>
        <input
          className="live-editor-field__input"
          type="time"
          value={eventTime}
          onChange={(e) => onFieldChange('eventTime', e.target.value)}
          data-testid="live-editor-field-time"
        />
      </label>
      <label className="live-editor-field">
        <span className="live-editor-field__label">Место</span>
        <input
          className="live-editor-field__input"
          value={eventPlace}
          onChange={(e) => onFieldChange('eventPlace', e.target.value)}
          data-testid="live-editor-field-place"
        />
      </label>
      <div className="live-editor-field">
        <span className="live-editor-field__label">Обложка</span>
        <button
          type="button"
          className="live-editor-photo-btn"
          onClick={onCoverPhoto}
          data-testid="live-editor-field-cover"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          Загрузить фото
        </button>
      </div>
    </div>
  );
}
