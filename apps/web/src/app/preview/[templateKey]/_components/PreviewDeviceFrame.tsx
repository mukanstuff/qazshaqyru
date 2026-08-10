import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Device frame for preview mode.
 * No overflow on screen — invitation content controls its own height.
 * The outer .preview-root provides the single scroll context.
 */
export function PreviewDeviceFrame({ children }: Props) {
  return (
    <div className="preview-device">
      <div className="preview-device__screen">
        {children}
      </div>
    </div>
  );
}
