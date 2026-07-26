import type { InvitationDocument } from '@/lib/invitations/document';

export type EditorStepId =
  | 'basics'
  | 'cover'
  | 'datetime'
  | 'location'
  | 'details'
  | 'rsvp'
  | 'publish';

export type ReadinessIssueSeverity = 'info' | 'warning' | 'error';

export type ReadinessIssue = {
  id: string;
  stepId: EditorStepId;
  severity: ReadinessIssueSeverity;
  title: string;
  description?: string;
  ctaLabel?: string;
};

export type EditorReadinessStep = {
  id: EditorStepId;
  label: string;
  completed: boolean;
  required: boolean;
  issues: ReadinessIssue[];
};

export type ReadinessResult = {
  totalSteps: number;
  completedSteps: number;
  requiredComplete: boolean;
  blockingIssues: ReadinessIssue[];
  warnings: ReadinessIssue[];
  steps: EditorReadinessStep[];
  readinessScore: number;
  nextAction: ReadinessIssue | null;
};

export type ReadinessLocale = 'kz' | 'ru';

type StepDef = { id: EditorStepId; labelRu: string; labelKz: string; required: boolean };

const STEP_DEFS: StepDef[] = [
  { id: 'basics', labelRu: 'Имена', labelKz: 'Есімдер', required: true },
  { id: 'cover', labelRu: 'Фото', labelKz: 'Фото', required: false },
  { id: 'datetime', labelRu: 'Дата', labelKz: 'Күн', required: true },
  { id: 'location', labelRu: 'Место', labelKz: 'Орын', required: false },
  { id: 'details', labelRu: 'Текст', labelKz: 'Мәтін', required: false },
  { id: 'rsvp', labelRu: 'Ответ гостей', labelKz: 'Қонақ жауабы', required: false },
  { id: 'publish', labelRu: 'Публикация', labelKz: 'Жариялау', required: true },
];

type IssueCopy = { title: string; description?: string; ctaLabel?: string };

const ISSUE_COPY: Record<
  string,
  Record<ReadinessLocale, IssueCopy>
> = {
  'missing-names': {
    ru: {
      title: 'Добавьте имена',
      description: 'Гости должны понять, кого приглашают',
      ctaLabel: 'Заполнить имена',
    },
    kz: {
      title: 'Есімдерді жазыңыз',
      description: 'Қонақтар кімді шақырғанын түсінуі керек',
      ctaLabel: 'Есімдерді толтыру',
    },
  },
  'missing-cover': {
    ru: {
      title: 'Добавьте фото на обложку',
      description: 'Фото повышает доверие и отклик гостей',
      ctaLabel: 'Загрузить фото',
    },
    kz: {
      title: 'Мұқаба фотосы жоқ',
      description: 'Фото қонақтарға сенімдірек көрінеді',
      ctaLabel: 'Фото жүктеу',
    },
  },
  'missing-date': {
    ru: {
      title: 'Укажите дату',
      description: 'Дата нужна для календаря, таймера и ответа гостей',
      ctaLabel: 'Добавить дату',
    },
    kz: {
      title: 'Күнді жазыңыз',
      description: 'Күн күнтізбе, таймер және жауап үшін керек',
      ctaLabel: 'Күн қосу',
    },
  },
  'missing-place': {
    ru: {
      title: 'Добавьте место',
      description: 'Адрес поможет открыть карту',
      ctaLabel: 'Указать место',
    },
    kz: {
      title: 'Орынды жазыңыз',
      description: 'Мекенжай картаны ашуға көмектеседі',
      ctaLabel: 'Орын көрсету',
    },
  },
  'missing-body': {
    ru: {
      title: 'Можно добавить текст приглашения',
      description: 'Короткое обращение делает приглашение теплее',
      ctaLabel: 'Редактировать текст',
    },
    kz: {
      title: 'Шақыру мәтінін қосуға болады',
      description: 'Қысқа үндеу шақыруды жылырақ етеді',
      ctaLabel: 'Мәтінді өңдеу',
    },
  },
  'rsvp-hidden': {
    ru: {
      title: 'Ответ гостей скрыт',
      description: 'Включите секцию, чтобы собирать ответы гостей',
      ctaLabel: 'Секции',
    },
    kz: {
      title: 'Қонақ жауабы жасырын',
      description: 'Жауап жинау үшін бөлімді қосыңыз',
      ctaLabel: 'Бөлімдер',
    },
  },
  'not-ready-publish': {
    ru: {
      title: 'Ещё рано публиковать',
      description: 'Заполните обязательные поля',
      ctaLabel: 'Что осталось',
    },
    kz: {
      title: 'Жариялауға әлі ерте',
      description: 'Міндетті өрістерді толтырыңыз',
      ctaLabel: 'Не қалды',
    },
  },
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasValidDate(value: string | undefined | null): boolean {
  if (!value) return false;
  const t = new Date(value).getTime();
  return !Number.isNaN(t);
}

function readCoverPhoto(document: InvitationDocument): string {
  const td = document.templateData;
  return String(td.coverPhoto ?? td.backgroundImage ?? '');
}

function issue(
  id: string,
  stepId: EditorStepId,
  severity: ReadinessIssueSeverity,
  locale: ReadinessLocale,
): ReadinessIssue {
  const copy = ISSUE_COPY[id][locale];
  return {
    id,
    stepId,
    severity,
    title: copy.title,
    description: copy.description,
    ctaLabel: copy.ctaLabel,
  };
}

/**
 * Pure readiness engine for live editor guidance / publish confidence.
 */
export function computeReadiness(
  document: InvitationDocument,
  locale: ReadinessLocale = 'ru',
): ReadinessResult {
  const groom = String(document.customText.groomName ?? '');
  const bride = String(document.customText.brideName ?? '');
  const title = document.meta.title?.trim() ?? '';
  const hasNames = hasText(groom) || hasText(bride) || (title.length > 0 && title !== 'draft');
  const hasDate = hasValidDate(document.meta.eventDate);
  const hasPlace = hasText(document.meta.eventPlace);
  const hasAddress = hasText(document.meta.address);
  const hasCover = hasText(readCoverPhoto(document));
  const hasBody =
    hasText(document.customText.bodyTextRu) ||
    hasText(document.customText.bodyTextKz) ||
    hasText(document.customText.greeting);
  const hasRsvpSection = document.sections.some((s) => s.type === 'rsvp' && s.visible);
  const isPublished = document.meta.status === 'published';

  const issuesByStep: Record<EditorStepId, ReadinessIssue[]> = {
    basics: [],
    cover: [],
    datetime: [],
    location: [],
    details: [],
    rsvp: [],
    publish: [],
  };

  if (!hasNames) {
    issuesByStep.basics.push(issue('missing-names', 'basics', 'error', locale));
  }

  if (!hasCover) {
    issuesByStep.cover.push(issue('missing-cover', 'cover', 'warning', locale));
  }

  if (!hasDate) {
    issuesByStep.datetime.push(issue('missing-date', 'datetime', 'error', locale));
  }

  if (!hasPlace && !hasAddress) {
    issuesByStep.location.push(issue('missing-place', 'location', 'warning', locale));
  }

  if (!hasBody) {
    issuesByStep.details.push(issue('missing-body', 'details', 'info', locale));
  }

  if (!hasRsvpSection) {
    issuesByStep.rsvp.push(issue('rsvp-hidden', 'rsvp', 'info', locale));
  }

  if (!isPublished && (!hasNames || !hasDate)) {
    issuesByStep.publish.push(issue('not-ready-publish', 'publish', 'error', locale));
  }

  const steps: EditorReadinessStep[] = STEP_DEFS.map((def) => {
    const issues = issuesByStep[def.id];
    const completed =
      def.id === 'basics'
        ? hasNames
        : def.id === 'cover'
          ? hasCover
          : def.id === 'datetime'
            ? hasDate
            : def.id === 'location'
              ? hasPlace || hasAddress
              : def.id === 'details'
                ? hasBody
                : def.id === 'rsvp'
                  ? hasRsvpSection
                  : isPublished || (hasNames && hasDate);

    return {
      id: def.id,
      label: locale === 'kz' ? def.labelKz : def.labelRu,
      completed,
      required: def.required,
      issues,
    };
  });

  const completedSteps = steps.filter((s) => s.completed).length;
  const blockingIssues = steps.flatMap((s) => s.issues.filter((i) => i.severity === 'error'));
  const warnings = steps.flatMap((s) => s.issues.filter((i) => i.severity !== 'error'));
  const requiredComplete = steps.filter((s) => s.required).every((s) => s.completed);
  const readinessScore = Math.round((completedSteps / steps.length) * 100);
  const nextAction =
    blockingIssues[0] ?? warnings.find((i) => i.severity === 'warning') ?? warnings[0] ?? null;

  return {
    totalSteps: steps.length,
    completedSteps,
    requiredComplete,
    blockingIssues,
    warnings,
    steps,
    readinessScore,
    nextAction,
  };
}

/** Map readiness step → primary section type for scroll/select. */
export function stepToSectionType(stepId: EditorStepId): string | null {
  switch (stepId) {
    case 'basics':
      return 'hero-names';
    case 'cover':
      return 'cover-photo';
    case 'datetime':
      return 'calendar';
    case 'location':
      return 'venue-map';
    case 'details':
      return 'body-invitation';
    case 'rsvp':
      return 'rsvp';
    case 'publish':
      return null;
    default:
      return null;
  }
}
