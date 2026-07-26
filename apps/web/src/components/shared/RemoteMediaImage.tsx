'use client';

import Image from 'next/image';

interface RemoteMediaImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  fill?: boolean;
  width?: number;
  height?: number;
}

function isLocalUpload(src: string): boolean {
  return src.startsWith('/uploads/');
}

export function RemoteMediaImage({
  src,
  alt,
  style,
  className,
  onClick,
  fill = false,
  width = 400,
  height = 300,
}: RemoteMediaImageProps) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
  // eslint-disable-next-line @next/next/no-img-element -- data/blob URLs are not supported by next/image here
    return <img src={src} alt={alt}   onClick={onClick} />;
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={isLocalUpload(src)}
        
        
        onClick={onClick}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized={isLocalUpload(src)}
      
      
      onClick={onClick}
    />
  );
}
