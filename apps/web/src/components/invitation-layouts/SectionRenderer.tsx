'use client';

import { useMemo, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { getAssetUrl } from '@/lib/templates/helpers';
import { resolveManifestFields } from '@/lib/templates/manifest-fields';
import type { TemplateManifest, TemplateSection } from '@/lib/templates/manifest-types';
import type { InvitationDocumentSection } from '@/lib/invitations/document';
import {
  resolveSectionsFromManifest,
  visibleSectionsForRender,
} from '@/lib/invitations/document-state';
import type { LayoutProps } from './types';
import { TemplateBackdrop } from './sections/TemplateBackdrop';
import { EnvelopeIntroSection } from './sections/EnvelopeIntroSection';
import { HeroNamesSection } from './sections/HeroNamesSection';
import { BodyInvitationSection } from './sections/BodyInvitationSection';
import { CoverPhotoSection } from './sections/CoverPhotoSection';
import { MusicSection } from './sections/MusicSection';
import type { SectionContext } from './sections/types';

// Above-the-fold — static imports (immediate render, no SSR penalty to pay).
// Below-the-fold — lazy with ssr:false (no hydration mismatch, no JS until needed).

const CalendarSection = dynamic(
  () => import('./sections/CalendarSection').then((m) => m.CalendarSection),
  { ssr: false },
);
const CountdownSection = dynamic(
  () => import('./sections/CountdownSection').then((m) => m.CountdownSection),
  { ssr: false },
);
const VenueMapSection = dynamic(
  () => import('./sections/VenueMapSection').then((m) => m.VenueMapSection),
  { ssr: false },
);
const DressCodeSection = dynamic(
  () => import('./sections/DressCodeSection').then((m) => m.DressCodeSection),
  { ssr: false },
);
const GallerySection = dynamic(
  () => import('./sections/GallerySection').then((m) => m.GallerySection),
  { ssr: false },
);
const FinalTextSection = dynamic(
  () => import('./sections/FinalTextSection').then((m) => m.FinalTextSection),
  { ssr: false },
);
const RsvpSection = dynamic(
  () => import('./sections/RsvpSection').then((m) => m.RsvpSection),
  { ssr: false },
);
const WishesSection = dynamic(
  () => import('./sections/WishesSection').then((m) => m.WishesSection),
  { ssr: false },
);
const KaspiGiftsSection = dynamic(
  () => import('./sections/KaspiGiftsSection').then((m) => m.KaspiGiftsSection),
  { ssr: false },
);
const ProgramSection = dynamic(
  () => import('./sections/ProgramSection').then((m) => m.ProgramSection),
  { ssr: false },
);
const GuestTableNotice = dynamic(
  () => import('./sections/GuestTableNotice').then((m) => m.GuestTableNotice),
  { ssr: false },
);

const SECTION_RENDERERS = {
  'envelope-intro': EnvelopeIntroSection,
  'hero-names': HeroNamesSection,
  'body-invitation': BodyInvitationSection,
  'cover-photo': CoverPhotoSection,
  calendar: CalendarSection,
  countdown: CountdownSection,
  'venue-map': VenueMapSection,
  'dress-code': DressCodeSection,
  gallery: GallerySection,
  'final-text': FinalTextSection,
  rsvp: RsvpSection,
  wishes: WishesSection,
  music: MusicSection,
  kaspi: KaspiGiftsSection,
  program: ProgramSection,
} as const;

function sectionsForRender(
  manifest: TemplateManifest,
  documentSections: InvitationDocumentSection[] | undefined,
  templateData: Record<string, unknown> | undefined,
): Array<{
  id: string;
  type: TemplateSection['type'];
  props?: Record<string, unknown>;
  fieldBindings?: Record<string, string>;
}> {
  const resolved =
    documentSections ??
    resolveSectionsFromManifest(manifest, templateData ?? {});

  return visibleSectionsForRender(resolved).map((section) => ({
    id: section.id,
    type: section.type,
    props: section.props,
    fieldBindings: section.bindings,
  }));
}

export function SectionRenderer({ manifest, documentSections, ...layoutProps }: Props) {
  const fields = useMemo(
    () => resolveManifestFields(layoutProps.invitation),
    [layoutProps.invitation],
  );

  const assetUrl = (key: string) => {
    const file = manifest.assets[key];
    if (!file) return null;
    return getAssetUrl(manifest.slug, file);
  };

  const ctx: SectionContext = {
    ...layoutProps,
    manifest,
    fields,
    assetUrl,
  };

  const themeStyle = {
    '--inv-accent': manifest.theme.accent,
    '--inv-text-light': manifest.theme.textLight,
    '--inv-text-dark': manifest.theme.textDark,
    '--inv-overlay-gradient':
      'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
    fontFamily: manifest.theme.fonts.body,
  } as CSSProperties;

  const sections = sectionsForRender(
    manifest,
    documentSections,
    layoutProps.invitation.templateData as Record<string, unknown> | undefined,
  );

  return (
    <article
      className={`inv-layout inv-manifest inv-manifest--${manifest.slug} tpl-motion-luxe`}
      data-template={manifest.slug}
      data-lang={layoutProps.invitation.language}
      style={themeStyle}
    >
      <TemplateBackdrop manifest={manifest} />
      <div className="inv-content">
        {layoutProps.invitation.guestDisplayName ? (
          <p className="inv-personal-greeting">{layoutProps.invitation.guestDisplayName}</p>
        ) : null}
        <GuestTableNotice
          tableName={layoutProps.invitation.seatingTableName}
          invitationSlug={layoutProps.invitation.slug}
        />
        {sections.map((section) => {
          if (
            layoutProps.suppressGuestChrome &&
            (section.type === 'envelope-intro' || section.type === 'music')
          ) {
            return null;
          }

          const Component = SECTION_RENDERERS[section.type];
          if (!Component) return null;

          return (
            <Component
              key={section.id}
              ctx={ctx}
              sectionProps={section.props}
              bindings={section.fieldBindings}
            />
          );
        })}
      </div>
    </article>
  );
}
