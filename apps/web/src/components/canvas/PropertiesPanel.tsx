'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetCloseButton } from '@/components/ui/sheet';
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ButtonElement,
  ShapeElement,
  DividerElement,
  CoupleNamesElement,
  CountdownElement,
  RsvpFormElement,
  WishesElement,
  ProgramElement,
  MapElement,
  MusicPlayerElement,
  GiftBlockElement,
  QrCodeElement,
  LottieElement,
  VideoBgElement,
  OrnamentElement,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { T } from './inspector/shared';
import { TextSection } from './inspector/TextSection';
import { ImageSection } from './inspector/ImageSection';
import { ButtonSection } from './inspector/ButtonSection';
import { ShapeSection } from './inspector/ShapeSection';
import { PositionSection } from './inspector/PositionSection';
import { CommonActions } from './inspector/CommonActions';
import { TemplateSection } from './inspector/TemplateSection';
import { CoupleNamesSection } from './inspector/CoupleNamesSection';
import { CountdownSection } from './inspector/CountdownSection';
import { RsvpFormSection } from './inspector/RsvpFormSection';
import { WishesSection } from './inspector/WishesSection';
import { ProgramSection } from './inspector/ProgramSection';
import { MapSection } from './inspector/MapSection';
import { MusicSection } from './inspector/MusicSection';
import { GiftSection } from './inspector/GiftSection';
import { QrSection } from './inspector/QrSection';
import { LottieSection } from './inspector/LottieSection';
import { VideoBgSection } from './inspector/VideoBgSection';
import { OrnamentSection } from './inspector/OrnamentSection';
import { DividerSection } from './inspector/DividerSection';
import { DocumentSection } from './inspector/DocumentSection';

interface PropertiesPanelProps {
  /** Panel is shown whenever an element is selected OR a document is open. */
  open: boolean;
  selected: CanvasElement | null;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  locale: 'ru' | 'kz';
  mode: 'user' | 'template-builder';
  document?: InvitationCanvasDocument;
  onDocumentChange?: (patch: Partial<InvitationCanvasDocument>) => void;
  onClose: () => void;
}

/**
 * Element/document property editor — a bottom sheet at every screen width,
 * growing into a floating card on wider screens (the same treatment
 * `EditorSheet` uses, so every panel in the editor behaves alike).
 *
 * There is deliberately no docked side rail on desktop. This used to branch
 * on `useIsDesktop()` and render a 320px `<aside>` instead, which meant the
 * editor had two different layouts to keep working, and the rail forced the
 * rest of the chrome to reserve space for it.
 *
 * NON-MODAL, and that is the whole point. It used to be a Radix modal dialog:
 * an opaque 85dvh sheet on top of a dimmed, blurred, click-proof canvas. So
 * the single most common action in the product — select a heading, change its
 * size or colour, look at the result — could not be performed on a phone,
 * because the result was behind the panel doing the changing. Now the canvas
 * stays lit and interactive, the sheet is capped so the stage keeps the upper
 * half of the screen, tapping the canvas re-targets the panel instead of
 * dismissing it, and CanvasEditor scrolls the selected element into the strip
 * that is still visible.
 */
export function PropertiesPanel(props: PropertiesPanelProps) {
  const { open, selected, onUpdate, onDelete, onDuplicate, onLayer, locale, mode, document, onDocumentChange, onClose } = props;
  const t = T[locale];
  const [tab, setTab] = useState<'element' | 'document'>('element');

  if (!open || (!selected && !document)) return null;

  const noSelection = !selected;
  const showDocumentTab = tab === 'document';
  const showElementTab = !noSelection && tab === 'element';

  const elementBody = selected && (
    <>
      {selected.type === 'text' || selected.type === 'heading' ? (
        <TextSection el={selected as TextElement} onUpdate={onUpdate} t={t} />
      ) : null}
      {selected.type === 'image' && <ImageSection el={selected as ImageElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'button' && <ButtonSection el={selected as ButtonElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'shape' && <ShapeSection el={selected as ShapeElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'couple-names' && <CoupleNamesSection el={selected as CoupleNamesElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'countdown' && <CountdownSection el={selected as CountdownElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'rsvp-form' && <RsvpFormSection el={selected as RsvpFormElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'wishes' && <WishesSection el={selected as WishesElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'program' && <ProgramSection el={selected as ProgramElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'map' && <MapSection el={selected as MapElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'music' && <MusicSection el={selected as MusicPlayerElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'gift' && <GiftSection el={selected as GiftBlockElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'qr' && <QrSection el={selected as QrCodeElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'lottie' && <LottieSection el={selected as LottieElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'video-bg' && <VideoBgSection el={selected as VideoBgElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'ornament' && <OrnamentSection el={selected as OrnamentElement} onUpdate={onUpdate} t={t} />}
      {selected.type === 'divider' && <DividerSection el={selected as DividerElement} onUpdate={onUpdate} t={t} />}

      <PositionSection el={selected} onUpdate={onUpdate} t={t} />
      <CommonActions onDelete={onDelete} onDuplicate={onDuplicate} onLayer={onLayer} t={t} el={selected} onUpdate={onUpdate} />
      {mode === 'template-builder' && <TemplateSection el={selected} onUpdate={onUpdate} t={t} />}
    </>
  );

  const panelTitle = selected
    ? (locale === 'ru' ? 'Свойства' : 'Қасиеттері')
    : (locale === 'ru' ? 'Документ' : 'Құжат');

  const tabsAndBody = (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'element' | 'document')}>
        <TabsList className="w-full px-2">
          <TabsTrigger value="element" disabled={noSelection}>
            {locale === 'ru' ? 'Элемент' : 'Элемент'}
          </TabsTrigger>
          <TabsTrigger value="document">
            {locale === 'ru' ? 'Документ' : 'Құжат'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto p-4">
        {showElementTab && elementBody}
        {showElementTab && noSelection && (
          <div className="py-10 text-center font-body text-sm text-us-ink-muted">{t.emptyHint}</div>
        )}
        {showDocumentTab && document && onDocumentChange && (
          <DocumentSection doc={document} onChange={onDocumentChange} t={t} locale={locale} />
        )}
      </div>
    </>
  );

  return (
    <Sheet modal={false} open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent
        side="bottom"
        overlay={false}
        data-canvas-sheet="inspector"
        // 52dvh, not 85: the stage has to keep enough of the screen to show
        // what the controls below are doing to it.
        // On >=sm the card moves off-centre to the left so it stops sitting on
        // top of the 600px-wide stage it is editing.
        className="max-h-[52dvh] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-h-[78dvh] sm:w-full sm:max-w-sm sm:translate-x-0 sm:rounded-2xl sm:border"
        // Clicking the canvas selects another element; it must not slam the
        // panel shut. Escape and the close button still close it.
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        // Radix focuses the first control on open, which on a phone summons
        // the keyboard and scrolls the stage away before you have seen it.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{panelTitle}</SheetTitle>
          <SheetCloseButton />
        </SheetHeader>
        <SheetBody className="flex flex-1 flex-col p-0">
          {tabsAndBody}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
