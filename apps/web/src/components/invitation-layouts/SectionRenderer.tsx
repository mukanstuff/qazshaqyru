'use client';

import { useMemo, type CSSProperties } from 'react';
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
import { CalendarSection } from './sections/CalendarSection';
import { CountdownSection } from './sections/CountdownSection';
import { VenueMapSection } from './sections/VenueMapSection';
import { DressCodeSection } from './sections/DressCodeSection';
import { GallerySection } from './sections/GallerySection';
import { FinalTextSection } from './sections/FinalTextSection';
import { RsvpSection } from './sections/RsvpSection';
import { WishesSection } from './sections/WishesSection';
import { MusicSection } from './sections/MusicSection';
import { KaspiGiftsSection } from './sections/KaspiGiftsSection';
import { ProgramSection } from './sections/ProgramSection';
import { GuestTableNotice } from './sections/GuestTableNotice';
import type { SectionContext } from './sections/types';

interface Props extends LayoutProps {
  manifest: TemplateManifest;
  /** When set, overrides manifest.sections (document visibility/order). */
  documentSections?: InvitationDocumentSection[];
}

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
        <GuestTableNotice tableName={layoutProps.invitation.seatingTableName} />
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
