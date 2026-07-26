export type PublishCheckItem = {
  id: string;
  labelKey: string;
  ok: boolean;
  /** When false, item is shown but not required to publish. */
  required?: boolean;
};

export function buildPublishChecklist(input: {
  title: string;
  eventDate: string;
  eventPlace?: string | null;
  hasCouplePhoto?: boolean;
  hasProgram?: boolean;
}): PublishCheckItem[] {
  const hasTitle = Boolean(input.title?.trim());
  const hasDate = Boolean(input.eventDate) && !Number.isNaN(new Date(input.eventDate).getTime());
  const hasPlace = Boolean(input.eventPlace?.trim());

  return [
    { id: 'title', labelKey: 'invitation.publishCheck.titleField', ok: hasTitle, required: true },
    { id: 'date', labelKey: 'invitation.publishCheck.date', ok: hasDate, required: true },
    { id: 'place', labelKey: 'invitation.publishCheck.place', ok: hasPlace, required: false },
    {
      id: 'photo',
      labelKey: 'invitation.publishCheck.photo',
      ok: Boolean(input.hasCouplePhoto),
      required: false,
    },
    {
      id: 'program',
      labelKey: 'invitation.publishCheck.program',
      ok: Boolean(input.hasProgram),
      required: false,
    },
  ];
}

export function isPublishChecklistReady(items: PublishCheckItem[]): boolean {
  return items.filter((item) => item.required !== false).every((item) => item.ok);
}
