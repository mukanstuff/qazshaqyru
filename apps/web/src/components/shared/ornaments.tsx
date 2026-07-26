'use client';

import { cn } from '@/lib/shared/utils';

interface OrnamentProps {
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/* ─── KUNDELIK — SVG rosette ─── */
export function Kundelik({
  className,
  size = 64,
  color = 'currentColor',
  strokeWidth = 1,
}: OrnamentProps) {
  return (
    <KundelikSvg className={className} size={size} color={color} strokeWidth={strokeWidth} />
  );
}

function KundelikSvg({
  className,
  size = 64,
  color = 'currentColor',
  strokeWidth = 1,
}: OrnamentProps) {  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="47" stroke={color} strokeWidth={strokeWidth * 1.5} />
      {/* Thin ring */}
      <circle cx="50" cy="50" r="41" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.5" />
      {/* Middle ring */}
      <circle cx="50" cy="50" r="34" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.35" />

      {/* 8 petals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 360) / 8;
        return (
          <g key={i} transform={`rotate(${a} 50 50)`}>
            {/* Outer petal */}
            <path
              d="M50 9 Q62 26 50 34 Q38 26 50 9 Z"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Inner arc */}
            <path
              d="M50 18 Q57 26 50 30 Q43 26 50 18 Z"
              stroke={color}
              strokeWidth={strokeWidth * 0.6}
              fill="none"
              opacity="0.6"
            />
            {/* Tip dot */}
            <circle cx="50" cy="11.5" r="1.6" fill={color} opacity="0.8" />
            {/* Mid ring dot */}
            <circle cx="50" cy="24" r="1" fill={color} opacity="0.4" />
          </g>
        );
      })}

      {/* Cross lines */}
      <line x1="50" y1="34" x2="50" y2="66" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.4" />
      <line x1="34" y1="50" x2="66" y2="50" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.4" />

      {/* Center circles */}
      <circle cx="50" cy="50" r="10" stroke={color} strokeWidth={strokeWidth * 1.2} />
      <circle cx="50" cy="50" r="6" stroke={color} strokeWidth={strokeWidth * 0.8} />
      <circle cx="50" cy="50" r="2.5" fill={color} opacity="0.7" />
    </svg>
  );
}

/* ─── KUS KANATY — bird wings, updated ─── */
export function KusKanaty({
  className,
  size = 24,
  color = 'currentColor',
  strokeWidth = 0.9,
}: OrnamentProps) {
  return (
    <svg
      width={size * 4}
      height={size}
      viewBox="0 0 100 24"
      fill="none"
      
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(50 12)">
        {/* Left wing */}
        <path
          d="M0 0 C-10 -4 -20 -5 -32 -2 C-25 -0.5 -18 1 -10 0.5 C-16 2 -26 4 -32 3 C-26 4.5 -18 5 -10 4 C-4 3.5 0 2.5 0 2 Z"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <path
          d="M0 0 C-8 -2 -15 -3 -24 -1 C-18 0.5 -12 1 -6 0.5 C-10 1.5 -18 2.5 -24 1.5 C-18 2 -12 2.5 0 2.5 Z"
          stroke={color}
          strokeWidth={strokeWidth * 0.7}
          fill="none"
          opacity="0.6"
        />
        <circle cx="-22" cy="0.5" r="1.3" fill={color} opacity="0.55" />
        <circle cx="-14" cy="2.8" r="1" fill={color} opacity="0.4" />

        {/* Right wing */}
        <path
          d="M0 0 C10 -4 20 -5 32 -2 C25 -0.5 18 1 10 0.5 C16 2 26 4 32 3 C26 4.5 18 5 10 4 C4 3.5 0 2.5 0 2 Z"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <path
          d="M0 0 C8 -2 15 -3 24 -1 C18 0.5 12 1 6 0.5 C10 1.5 18 2.5 24 1.5 C18 2 12 2.5 0 2.5 Z"
          stroke={color}
          strokeWidth={strokeWidth * 0.7}
          fill="none"
          opacity="0.6"
        />
        <circle cx="22" cy="0.5" r="1.3" fill={color} opacity="0.55" />
        <circle cx="14" cy="2.8" r="1" fill={color} opacity="0.4" />

        {/* Center dot */}
        <circle r="2" fill={color} />
        <circle r="1" fill={color} opacity="0.6" />
      </g>
    </svg>
  );
}

/* ─── KOSHKAR MUIYIZ — ram horns corner, updated ─── */
export function KoshkarMuiyiz({
  className,
  size = 40,
  color = 'currentColor',
  strokeWidth = 1,
  corner = 'tl',
}: OrnamentProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rot = { tl: 0, tr: 90, bl: -90, br: 180 }[corner];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      
      
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main arc — horn */}
      <path
        d="M10 10 Q50 10 50 50"
        stroke={color}
        strokeWidth={strokeWidth * 1.6}
        fill="none"
        opacity="0.9"
      />
      <path
        d="M10 20 Q45 12 50 42"
        stroke={color}
        strokeWidth={strokeWidth * 0.9}
        fill="none"
        opacity="0.6"
      />

      {/* Scroll */}
      <path
        d="M16 16 Q32 16 32 32 Q32 46 20 46"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <path
        d="M22 22 Q30 22 30 30 Q30 38 22 38"
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        fill="none"
        opacity="0.6"
      />
      <circle cx="26" cy="26" r="4.5" stroke={color} strokeWidth={strokeWidth * 0.7} />
      <circle cx="26" cy="26" r="2" fill={color} opacity="0.65" />

      {/* Pearls */}
      <circle cx="16" cy="24" r="1.6" fill={color} opacity="0.75" />
      <circle cx="24" cy="16" r="1.6" fill={color} opacity="0.75" />
      <circle cx="44" cy="22" r="1.4" fill={color} opacity="0.5" />
      <circle cx="22" cy="44" r="1.4" fill={color} opacity="0.5" />
      <circle cx="36" cy="36" r="1" fill={color} opacity="0.35" />
    </svg>
  );
}

/* ─── HANGING ORNAMENT — diamond on string ─── */
export function HangingOrnament({
  className,
  size = 40,
  color = 'currentColor',
  strokeWidth = 1,
}: OrnamentProps) {
  return (
    <svg
      width={size * 0.6}
      height={size}
      viewBox="0 0 60 100"
      fill="none"
      
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* String */}
      <line x1="30" y1="0" x2="30" y2="20" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.7" />
      <circle cx="30" cy="0" r="2" fill={color} />

      {/* Main diamond */}
      <path
        d="M30 20 L50 50 L30 80 L10 50 Z"
        stroke={color}
        strokeWidth={strokeWidth * 1.2}
        fill="none"
      />
      {/* Inner diamond */}
      <path
        d="M30 29 L43 50 L30 71 L17 50 Z"
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        fill="none"
        opacity="0.55"
      />
      {/* Cross */}
      <line x1="30" y1="35" x2="30" y2="65" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.4" />
      <line x1="20" y1="50" x2="40" y2="50" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.4" />
      {/* Center */}
      <circle cx="30" cy="50" r="3" fill={color} opacity="0.7" />

      {/* Side curls */}
      <path d="M10 50 Q2 44 2 50 Q2 56 8 53" stroke={color} strokeWidth={strokeWidth * 0.7} fill="none" opacity="0.65" />
      <path d="M50 50 Q58 44 58 50 Q58 56 52 53" stroke={color} strokeWidth={strokeWidth * 0.7} fill="none" opacity="0.65" />

      {/* Pendant */}
      <line x1="30" y1="80" x2="30" y2="90" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.65" />
      <circle cx="30" cy="94" r="4" fill={color} opacity="0.7" />
      <circle cx="30" cy="94" r="2" fill={color} opacity="0.4" />
    </svg>
  );
}

/* ─── ORNAMENT DIVIDER — three variants ─── */
export function OrnamentDivider({
  className,
  size = 24,
  color = 'currentColor',
  width = 300,
  variant = 'simple',
}: OrnamentProps & { width?: number; variant?: 'kundelik' | 'kuskanaty' | 'simple' }) {
  const pad = Math.max(0, (width - size) / 2);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        maxWidth: '100%',
        margin: '0 auto',
        color,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          maxWidth: pad,
          background: `linear-gradient(90deg, transparent, ${color})`,
          opacity: 0.45,
        }}
      />

      {variant === 'kundelik' && (
        <div style={{ margin: '0 0.5rem' }}>
          <Kundelik size={size} color={color} strokeWidth={0.8} />
        </div>
      )}

      {variant === 'kuskanaty' && (
        <div style={{ margin: '0 0.5rem' }}>
          <KusKanaty size={size * 0.5} color={color} strokeWidth={0.8} />
        </div>
      )}

      {variant === 'simple' && (
        <div style={{ margin: '0 0.5rem' }}>
          <svg width={size * 2} height={size * 0.6} viewBox="0 0 48 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="7" x2="18" y2="7" stroke={color} strokeWidth="0.8" opacity="0.5" />
            <path d="M21 2 L24 7 L21 12 L18 7 Z" stroke={color} strokeWidth="0.8" fill="none" />
            <circle cx="24" cy="7" r="1.5" fill={color} opacity="0.7" />
            <line x1="30" y1="7" x2="48" y2="7" stroke={color} strokeWidth="0.8" opacity="0.5" />
          </svg>
        </div>
      )}

      <div
        style={{
          flex: 1,
          height: 1,
          maxWidth: pad,
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: 0.45,
        }}
      />
    </div>
  );
}

/* ─── VERTICAL BORDER ─── */
export function VerticalBorder({
  className,
  color = 'currentColor',
  height = 600,
}: OrnamentProps & { height?: number }) {
  const reps = Math.floor(height / 50);

  return (
    <svg
      width="20"
      height={height}
      viewBox={`0 0 20 ${height}`}
      fill="none"
      
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="10" y1="0" x2="10" y2={height} stroke={color} strokeWidth="0.4" opacity="0.3" />
      {Array.from({ length: reps }).map((_, i) => {
        const y = i * 50 + 25;
        return (
          <g key={i}>
            <path d="M10 0 L14 8 L10 16 L6 8 Z" transform={`translate(0 ${y - 8})`} stroke={color} strokeWidth="0.6" fill="none" opacity="0.6" />
            <circle cx="10" cy={y} r="1.2" fill={color} opacity="0.55" />
            <circle cx="10" cy={y - 16} r="0.8" fill={color} opacity="0.35" />
            <circle cx="10" cy={y + 16} r="0.8" fill={color} opacity="0.35" />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── LOGO MARK — arch portal monogram ─── */
export function LogoMark({
  className,
  size = 32,
  color = 'currentColor',
}: OrnamentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer arch portal */}
      <path
        d="M6 42V18C6 10.268 12.268 4 20 4H28C35.732 4 42 10.268 42 18V42"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Inner gold accent arch */}
      <path
        d="M12 38V20C12 14.477 16.477 10 22 10H26C31.523 10 36 14.477 36 20V38"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Invitation fold mark */}
      <path
        d="M18 24L24 29L30 24"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="1.5" fill={color} />
    </svg>
  );
}

/* ─── WHATSAPP ICON ─── */
export function WhatsappIcon({
  className,
  size = 18,
  color = 'currentColor',
}: OrnamentProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}  xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 0 1-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1 1 12 20z" />
    </svg>
  );
}
