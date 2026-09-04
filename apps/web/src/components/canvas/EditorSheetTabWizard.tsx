'use client';

import { useCallback, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadButton } from '@/components/invitation-layouts/UploadButton';
import { applyWizardToCanvasDocument } from '@/lib/canvas/apply-wizard-placeholders';
import { readWizardFormFromDocument } from '@/lib/canvas/read-wizard-placeholders';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import type { QuickWizardFormData } from '@/lib/shared/quick-wizard-schema';

interface Props {
  document: InvitationCanvasDocument;
  onWizardApply: (nextDoc: InvitationCanvasDocument) => void;
  onClose: () => void;
  locale: 'ru' | 'kz';
}

/**
 * "Wizard" tab — fast-fill form inside the quick-edit sheet.
 *
 * This used to be its own separate bottom sheet, opened by a second button
 * in the toolbar next to the quick-edit FAB. Two buttons that both open
 * "something to edit the invitation" — one a form, one a five-tab sheet,
 * both able to edit couple names — read as two competing menus with no
 * clear reason to pick one over the other. Folding the form into the first
 * tab of the same sheet keeps both entry points (FAB → Texts tab, toolbar
 * "Заполнить" → this tab) but leaves exactly one sheet to reason about.
 *
 * On apply it calls applyWizardToCanvasDocument() to bind placeholderKey
 * elements with the user's data, then closes the sheet.
 */
export function EditorSheetTabWizard({ document, onWizardApply, onClose, locale }: Props) {
  // Seeded from the document, not from blanks.
  //
  // This form opens automatically the first time an invitation is edited, and
  // it used to open empty — on a template that already reads "Айдар және
  // Айсұлу · «Салтанат» сарайы". So the first screen of the product presented
  // three empty required fields and refused to apply until they were filled,
  // as if nothing was there. Now it shows what the invitation currently says,
  // which makes it an edit form rather than a reset form, and lets someone who
  // only wants to change the date change the date.
  const [form, setForm] = useState<QuickWizardFormData>(() =>
    readWizardFormFromDocument(document),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  const update = (patch: Partial<QuickWizardFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.names.trim()) errs.names = locale === 'ru' ? 'Введите имена пары' : 'Жұп есімдерін енгізіңіз';
    if (!form.eventDate) errs.eventDate = locale === 'ru' ? 'Выберите дату' : 'Күнді таңдаңыз';
    if (!form.eventPlace.trim()) errs.eventPlace = locale === 'ru' ? 'Введите название площадки' : 'Алаң атауын енгізіңіз';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApply = useCallback(async () => {
    if (!validate()) return;
    setIsApplying(true);
    try {
      const updatedDoc = applyWizardToCanvasDocument(document, form, locale);
      onWizardApply(updatedDoc);
      onClose();
    } finally {
      setIsApplying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, form, locale, onWizardApply, onClose]);

  return (
    <div className="canvas-wizard-sheet">
      <p className="canvas-wizard-sheet__subtitle">
        {locale === 'ru'
          ? 'Введите данные мероприятия — шаблон заполнится автоматически'
          : 'Іс-шара деректерін енгізіңіз — үлгі автоматты түрде толтырылады'}
      </p>

      <div className="canvas-wizard-sheet__form">
        {/* Names */}
        <div className="wizard-field">
          <Label htmlFor="wiz-names">
            {locale === 'ru' ? 'Имена пары' : 'Жұптың есімдері'}
          </Label>
          <Input
            id="wiz-names"
            value={form.names}
            onChange={(e) => update({ names: e.target.value })}
            placeholder={locale === 'ru' ? 'Айбек & Айша' : 'Әмір & Айсұлу'}
          />
          {errors.names && (
            <p className="wizard-field-error">{errors.names}</p>
          )}
        </div>

        {/* Date + Time */}
        <div className="wizard-field-row">
          <div className="wizard-field">
            <Label htmlFor="wiz-date">
              {locale === 'ru' ? 'Дата' : 'Күні'}
            </Label>
            <Input
              id="wiz-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => update({ eventDate: e.target.value })}
            />
            {errors.eventDate && (
              <p className="wizard-field-error">{errors.eventDate}</p>
            )}
          </div>
          <div className="wizard-field">
            <Label htmlFor="wiz-time">
              {locale === 'ru' ? 'Время' : 'Уақыты'}
            </Label>
            <Input
              id="wiz-time"
              type="time"
              value={form.eventTime || ''}
              onChange={(e) => update({ eventTime: e.target.value })}
            />
          </div>
        </div>

        {/* Venue */}
        <div className="wizard-field">
          <Label htmlFor="wiz-venue">
            {locale === 'ru' ? 'Площадка' : 'Алаң'}
          </Label>
          <Input
            id="wiz-venue"
            value={form.eventPlace}
            onChange={(e) => update({ eventPlace: e.target.value })}
            placeholder={locale === 'ru' ? 'Банкетный зал «Сказка»' : '«Ерке» банкет залы'}
          />
          {errors.eventPlace && (
            <p className="wizard-field-error">{errors.eventPlace}</p>
          )}
        </div>

        {/* Address */}
        <div className="wizard-field">
          <Label htmlFor="wiz-address">
            {locale === 'ru' ? 'Адрес' : 'Мекенжай'}
          </Label>
          <Input
            id="wiz-address"
            value={form.address || ''}
            onChange={(e) => update({ address: e.target.value })}
            placeholder={locale === 'ru' ? 'ул. Абая 100, Алматы' : 'Әбілов көш. 100, Алматы'}
          />
        </div>

        {/* Cover photo */}
        <div className="wizard-field">
          <Label>
            {locale === 'ru' ? 'Фото на обложку' : 'Мұқаба фотосы'}
          </Label>
          {form.coverPhoto ? (
            <Card className="overflow-hidden">
              <img
                src={form.coverPhoto}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="flex gap-2 p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => update({ coverPhoto: '' })}
                >
                  <X className="h-3 w-3" />
                  {locale === 'ru' ? 'Удалить' : 'Жою'}
                </Button>
              </div>
            </Card>
          ) : (
            <UploadButton
              onUpload={(url) => update({ coverPhoto: url })}
              label={locale === 'ru' ? 'Загрузить фото' : 'Фото жүктеу'}
            />
          )}
        </div>
      </div>

      <div className="canvas-wizard-sheet__footer">
        <Button
          type="button"
          variant="default"
          className="w-full"
          onClick={handleApply}
          disabled={isApplying}
        >
          {isApplying ? (
            locale === 'ru' ? 'Применяем…' : 'Қолданылып жатыр…'
          ) : (
            <>
              <Check className="h-4 w-4" />
              {locale === 'ru' ? 'Применить к приглашению' : 'Шақыруға қолдану'}
            </>
          )}
        </Button>
        <p className="text-center font-body text-xs text-us-ink-muted">
          {locale === 'ru'
            ? 'Изменения применятся сразу к шаблону'
            : 'Өзгерістер бірден үлгіге қолданылады'}
        </p>
      </div>
    </div>
  );
}
