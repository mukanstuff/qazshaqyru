'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  testId?: string;
}

/** Phone frame only — workspace scroll lives on `.live-editor-stage`, not here. */
export function LiveEditorPhonePreview({ children, testId }: Props) {
  return (
    <div className="live-editor-phone" data-testid={testId}>
      <div className="live-editor-phone__frame">
        <div className="live-editor-phone__screen">
          <div className="live-editor-phone__viewport">
            <div className="live-editor-phone__content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
