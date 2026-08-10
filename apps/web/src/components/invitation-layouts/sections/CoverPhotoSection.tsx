'use client';

import { boundField, type SectionProps } from './types';
import { CouplePhotoPlaceholder } from './CouplePhotoPlaceholder';

export function CoverPhotoSection({ ctx, bindings, sectionProps }: SectionProps) {
  const photo = boundField(bindings, 'photo', ctx.fields);
  const optional = sectionProps?.optional === true;
  const showPlaceholder = !photo && (ctx.isEditing || optional);
  const photoKey = bindings?.photo ?? 'coverPhoto';

  if (!photo && !showPlaceholder) return null;

  const onPickFile = () => {
    if (!ctx.isEditing || !ctx.onPhotoSave) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      void ctx.onPhotoSave?.(photoKey, url);
    };
    input.click();
  };

  return (
    <section className="inv-section inv-manifest-cover" data-section="cover-photo">
      <div className="inv-section__inner">
        {photo ? (
          <div className="inv-manifest-cover__frame inv-manifest-cover__frame--ornate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" />
            {ctx.isEditing && ctx.onPhotoSave ? (
              <button
                type="button"
                className="inv-manifest-cover__edit-btn"
                onClick={onPickFile}
              >
                Сменить фото
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="inv-manifest-cover__placeholder-btn w-full"
            onClick={ctx.isEditing ? onPickFile : undefined}
            disabled={!ctx.isEditing}
          >
            <CouplePhotoPlaceholder />
            {ctx.isEditing ? (
              <span className="mt-2 block text-sm text-us-ink-muted">Добавить фото</span>
            ) : null}
          </button>
        )}
      </div>
    </section>
  );
}
