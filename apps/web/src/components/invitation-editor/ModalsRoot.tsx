'use client';

/**
 * ModalsRoot — mounts all editor modals (one per section) in a single tree.
 *
 * Each modal is only rendered when its corresponding tab is opened
 * (EditorUiProvider.openModal). Only one modal is visible at a time.
 */

import { EditorModal } from './EditorModal';
import { ContentPanel } from './panels/ContentPanel';
import { DesignPanel } from './panels/DesignPanel';
import { MediaPanel } from './panels/MediaPanel';
import { PublishPanel } from './panels/PublishPanel';

interface Props {
  isPublished: boolean;
  backHref: string;
}

export function ModalsRoot({ isPublished, backHref }: Props) {
  return (
    <>
      <EditorModal
        tab="content"
        title="Содержание"
        subtitle="Имена, дата, место, RSVP и язык"
      >
        <ContentPanel />
      </EditorModal>

      <EditorModal
        tab="design"
        title="Оформление"
        subtitle="Цвета, анимация, шрифты и поведение страницы"
        width={500}
      >
        <DesignPanel />
      </EditorModal>

      <EditorModal
        tab="media"
        title="Медиа"
        subtitle="Музыка, галерея фотографий и карточка ссылки"
        width={500}
      >
        <MediaPanel />
      </EditorModal>

      <EditorModal
        tab="publish"
        title="Публикация"
        subtitle="Ссылка для гостей, публикация и шеринг"
        width={460}
      >
        <PublishPanel isPublished={isPublished} backHref={backHref} />
      </EditorModal>
    </>
  );
}