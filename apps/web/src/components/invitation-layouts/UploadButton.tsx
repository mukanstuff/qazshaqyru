'use client';

import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadImageFile } from '@/lib/uploads/upload-client';
import { useI18n } from '@/i18n';

interface UploadButtonProps {
  onUpload: (url: string) => void;
  invitationId?: string;
  accept?: string;
  label?: string;
}

export function UploadButton({
  onUpload,
  invitationId,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  label,
}: UploadButtonProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonLabel = label ?? t('common.uploadPhoto');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const res = await uploadImageFile(file, invitationId);
      if (!res.success || !res.url) {
        throw new Error(res.message || t('common.uploadError'));
      }
      onUpload(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.uploadError'));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        id="upload-bg-input"
      />
      <label
        htmlFor="upload-bg-input"
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-us-border bg-us-surface px-4 py-2 font-body text-sm font-medium text-us-ink shadow-us-sm transition-colors hover:border-us-accent/30 hover:bg-us-accent/5"
      >
        {loading ? (
          <>
            <Loader2 size={16}  />
            {t('common.uploading')}
          </>
        ) : (
          <>
            <Upload size={16} />
            {buttonLabel}
          </>
        )}
      </label>
      {error && (
        <p >
          {error}
        </p>
      )}
    </div>
  );
}
