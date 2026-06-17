'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Check, ChevronLeft, ChevronRight, Sparkles, Copy, Users, FileText, Palette } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import {
  updateInvitationDetailsAction,
  updateInvitationDesignAction,
  updateInvitationContentAction,
  publishInvitationAction,
  archiveInvitationAction,
  addGuestsAction,
  deleteGuestAction,
} from '@/lib/actions';
import { useI18n } from '@/i18n';
import { useAutosave } from '@/hooks/use-autosave';

interface InvitationData {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  title: string;
  eventType: string;
  eventDate: string;
  eventTime: string | null;
  eventPlace: string | null;
  address: string | null;
  mapUrl: string | null;
  musicUrl: string | null;
  templateKey: string;
  templateData: Record<string, unknown>;
  customText: Record<string, unknown>;
  guests: Array<{
    id: string;
    name: string;
    phone: string | null;
    side: 'bride' | 'groom' | null;
    hasPlusOne: boolean;
    plusOneName: string | null;
    guestToken: string;
    sentAt: string | null;
  }>;
}

interface Props {
  invitation: InvitationData;
}

type Tab = 'details' | 'design' | 'content' | 'guests';

const TABS: Array<{ key: Tab; icon: typeof FileText; label: string }> = [
  { key: 'details', icon: FileText, label: 'Детали' },
  { key: 'design', icon: Palette, label: 'Дизайн' },
  { key: 'content', icon: Sparkles, label: 'Текст' },
  { key: 'guests', icon: Users, label: 'Гости' },
];

const TEMPLATES = [
  { key: 'classic', name: 'Классика', color: 'from-stone-700 to-stone-900', accent: '#c9a96e' },
  { key: 'elegant', name: 'Элегантный', color: 'from-slate-700 to-indigo-900', accent: '#a78bfa' },
  { key: 'golden', name: 'Золотой', color: 'from-amber-700 to-yellow-900', accent: '#fbbf24' },
  { key: 'nature', name: 'Природа', color: 'from-emerald-700 to-teal-900', accent: '#34d399' },
  { key: 'romantic', name: 'Романтика', color: 'from-rose-700 to-pink-900', accent: '#fb7185' },
  { key: 'modern', name: 'Современный', color: 'from-zinc-700 to-stone-900', accent: '#e4e4e7' },
];

const EVENT_TYPES = [
  { value: 'wedding', label: 'Свадьба' },
  { value: 'toy', label: 'Той' },
  { value: 'betashar', label: 'Беташар' },
  { value: 'kyz_uzatu', label: 'Кыз узату' },
  { value: 'birthday', label: 'День рождения' },
  { value: 'anniversary', label: 'Юбилей' },
  { value: 'corporate', label: 'Корпоратив' },
  { value: 'other', label: 'Другое' },
];

export function InvitationEditor({ invitation }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('details');
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [details, setDetails] = useState({
    title: invitation.title,
    eventType: invitation.eventType,
    eventDate: invitation.eventDate.slice(0, 10),
    eventTime: invitation.eventTime || '',
    eventPlace: invitation.eventPlace || '',
    address: invitation.address || '',
    mapUrl: invitation.mapUrl || '',
    musicUrl: invitation.musicUrl || '',
  });

  // Autosave for the Details tab. Other tabs keep their explicit Save
  // button because they involve larger multi-field changes (design
  // template, content program list) that benefit from a deliberate commit.
  const detailsAutosave = useAutosave({
    value: details,
    delayMs: 1200,
    enabled: tab === 'details',
    save: async (v) => {
      await updateInvitationDetailsAction({
        id: invitation.id,
        title: v.title,
        eventType: v.eventType as any,
        eventDate: new Date(v.eventDate).toISOString(),
        eventTime: v.eventTime || null,
        eventPlace: v.eventPlace || null,
        address: v.address || null,
        mapUrl: v.mapUrl || null,
        musicUrl: v.musicUrl || null,
      });
    },
  });

  useEffect(() => {
    if (detailsAutosave.lastSavedAt) {
      setSavedAt(detailsAutosave.lastSavedAt.toLocaleTimeString('ru-RU'));
    }
  }, [detailsAutosave.lastSavedAt]);

  useEffect(() => {
    if (detailsAutosave.status === 'error' && detailsAutosave.error) {
      toast({
        title: t('invitation.edit.saveError'),
        description: detailsAutosave.error.message,
        variant: 'destructive',
      });
    }
  }, [detailsAutosave.status, detailsAutosave.error, toast, t]);

  const [design, setDesign] = useState({
    templateKey: invitation.templateKey,
    backgroundImage: (invitation.templateData.backgroundImage as string) || '',
  });

  const [content, setContent] = useState({
    greeting: (invitation.customText.greeting as string) || '',
    aboutCouple: (invitation.customText.aboutCouple as string) || '',
    dressCode: (invitation.customText.dressCode as string) || '',
    footer: (invitation.customText.footer as string) || '',
    program: ((invitation.customText.program as any[]) || []).map((p) => ({
      time: p.time || '',
      title: p.title || '',
      description: p.description || '',
    })),
  });

  const [guests, setGuests] = useState(invitation.guests);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', side: '' as '' | 'bride' | 'groom' });

  const eventDate = new Date(invitation.eventDate);

  async function saveDetails() {
    try {
      await updateInvitationDetailsAction({
        id: invitation.id,
        title: details.title,
        eventType: details.eventType as any,
        eventDate: new Date(details.eventDate).toISOString(),
        eventTime: details.eventTime || null,
        eventPlace: details.eventPlace || null,
        address: details.address || null,
        mapUrl: details.mapUrl || null,
        musicUrl: details.musicUrl || null,
      });
      setSavedAt(new Date().toLocaleTimeString('ru-RU'));
      toast({ title: 'Сохранено' });
    } catch (e) {
      toast({ title: 'Ошибка сохранения', description: String(e), variant: 'destructive' });
    }
  }

  async function saveDesign() {
    try {
      await updateInvitationDesignAction({
        id: invitation.id,
        templateKey: design.templateKey,
        templateData: { backgroundImage: design.backgroundImage || undefined },
      });
      setSavedAt(new Date().toLocaleTimeString('ru-RU'));
      toast({ title: 'Дизайн сохранён' });
    } catch (e) {
      toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
    }
  }

  async function saveContent() {
    try {
      const cleanedProgram = content.program.filter((p) => p.time && p.title);
      await updateInvitationContentAction({
        id: invitation.id,
        customText: {
          greeting: content.greeting,
          aboutCouple: content.aboutCouple,
          dressCode: content.dressCode,
          footer: content.footer,
          program: cleanedProgram,
        },
      });
      setSavedAt(new Date().toLocaleTimeString('ru-RU'));
      toast({ title: 'Тексты сохранены' });
    } catch (e) {
      toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
    }
  }

  async function togglePublish() {
    startTransition(async () => {
      try {
        await publishInvitationAction(invitation.id);
        toast({ title: invitation.status === 'published' ? 'Снято с публикации' : 'Опубликовано!' });
        router.refresh();
      } catch (e) {
        toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
      }
    });
  }

  async function archive() {
    if (!confirm('Архивировать приглашение? Это скроет его из списка.')) return;
    startTransition(async () => {
      await archiveInvitationAction(invitation.id);
    });
  }

  async function handleAddGuest() {
    if (!newGuest.name.trim()) return;
    try {
      const result = await addGuestsAction({
        invitationId: invitation.id,
        guests: [
          {
            name: newGuest.name.trim(),
            phone: newGuest.phone.trim() || undefined,
            side: newGuest.side || undefined,
            hasPlusOne: false,
          },
        ],
      });
      toast({ title: 'Гость добавлен', description: `Всего: ${result.created}` });
      setNewGuest({ name: '', phone: '', side: '' });
      router.refresh();
    } catch (e) {
      toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
    }
  }

  async function handleBulkAdd() {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    try {
      const result = await addGuestsAction({
        invitationId: invitation.id,
        guests: lines.map((line) => {
          const [name, phone] = line.split('|').map((p) => p.trim());
          return { name: name || line, phone: phone || undefined, hasPlusOne: false };
        }),
      });
      toast({ title: 'Гости добавлены', description: `${result.created} гостей` });
      setBulkText('');
      setBulkMode(false);
      router.refresh();
    } catch (e) {
      toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
    }
  }

  async function handleDeleteGuest(id: string) {
    if (!confirm('Удалить гостя?')) return;
    try {
      await deleteGuestAction(id);
      router.refresh();
    } catch (e) {
      toast({ title: 'Ошибка', description: String(e), variant: 'destructive' });
    }
  }

  function copyShareLink() {
    const url = `${window.location.origin}/i/${invitation.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Ссылка скопирована' });
  }

  function shareWhatsApp() {
    const url = `${window.location.origin}/i/${invitation.slug}`;
    const text = encodeURIComponent(`Вас приглашают на торжество!\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-stone-100 overflow-x-auto">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-9 px-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {detailsAutosave.status === 'saving' && (
            <span className="text-xs text-stone-400 inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('invitation.edit.saving')}
            </span>
          )}
          {detailsAutosave.status === 'saved' && savedAt && (
            <span className="text-xs text-stone-400 inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              {t('invitation.edit.saved')}
            </span>
          )}
          {detailsAutosave.status === 'error' && (
            <span className="text-xs text-rose-500 inline-flex items-center gap-1">
              {t('invitation.edit.saveError')}
            </span>
          )}
          <button
            onClick={copyShareLink}
            disabled={invitation.status !== 'published'}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-3.5 h-3.5" />
            Ссылка
          </button>
          <button
            onClick={shareWhatsApp}
            disabled={invitation.status !== 'published'}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            WhatsApp
          </button>
          <button
            onClick={togglePublish}
            disabled={pending}
            className={`h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
              invitation.status === 'published'
                ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                : 'text-white'
            }`}
            style={
              invitation.status !== 'published'
                ? { background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)' }
                : undefined
            }
          >
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {invitation.status === 'published' ? 'Снять' : 'Опубликовать'}
          </button>
        </div>
      </div>

      {tab === 'details' && (
        <Card>
          <h2 className="font-medium text-stone-800 mb-6">Основная информация</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Название">
              <input
                value={details.title}
                onChange={(e) => setDetails({ ...details, title: e.target.value })}
                maxLength={200}
                className="input"
              />
            </Field>
            <Field label="Тип события">
              <select
                value={details.eventType}
                onChange={(e) => setDetails({ ...details, eventType: e.target.value })}
                className="input"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Дата">
              <input
                type="date"
                value={details.eventDate}
                onChange={(e) => setDetails({ ...details, eventDate: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Время">
              <input
                type="time"
                value={details.eventTime}
                onChange={(e) => setDetails({ ...details, eventTime: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Место" full>
              <input
                value={details.eventPlace}
                onChange={(e) => setDetails({ ...details, eventPlace: e.target.value })}
                placeholder="Ресторан «Жарық»"
                maxLength={300}
                className="input"
              />
            </Field>
            <Field label="Адрес" full>
              <input
                value={details.address}
                onChange={(e) => setDetails({ ...details, address: e.target.value })}
                placeholder="г. Алматы, ул. Абая 1"
                maxLength={500}
                className="input"
              />
            </Field>
            <Field label="Карта (URL)" full>
              <input
                value={details.mapUrl}
                onChange={(e) => setDetails({ ...details, mapUrl: e.target.value })}
                placeholder="https://2gis.kz/..."
                className="input"
              />
            </Field>
            <Field label="URL музыки (mp3, wav)" full>
              <input
                value={details.musicUrl}
                onChange={(e) => setDetails({ ...details, musicUrl: e.target.value })}
                placeholder="https://example.com/song.mp3"
                className="input"
              />
            </Field>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={saveDetails} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </button>
          </div>
        </Card>
      )}

      {tab === 'design' && (
        <Card>
          <h2 className="font-medium text-stone-800 mb-6">Шаблон оформления</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setDesign({ ...design, templateKey: t.key })}
                className={`aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all relative ${
                  design.templateKey === t.key ? 'border-rose-500 scale-[0.98]' : 'border-transparent hover:border-stone-200'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-light tracking-wider">{t.name}</span>
                </div>
                <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{ background: t.accent }} />
              </button>
            ))}
          </div>
          <Field label="Фоновое изображение (URL, опционально)">
            <input
              value={design.backgroundImage}
              onChange={(e) => setDesign({ ...design, backgroundImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="input"
            />
            <p className="text-xs text-stone-400 mt-1">Если пусто — используется фото из шаблона</p>
          </Field>
          <div className="mt-6 flex justify-end">
            <button onClick={saveDesign} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Сохранить дизайн
            </button>
          </div>
        </Card>
      )}

      {tab === 'content' && (
        <Card>
          <h2 className="font-medium text-stone-800 mb-6">Тексты приглашения</h2>
          <div className="space-y-5">
            <Field label="Приветствие" hint="Первое, что увидят гости">
              <textarea
                rows={4}
                value={content.greeting}
                onChange={(e) => setContent({ ...content, greeting: e.target.value })}
                placeholder="Дорогие наши родные и друзья! Приглашаем вас..."
                className="input"
              />
            </Field>
            <Field label="О нас">
              <textarea
                rows={4}
                value={content.aboutCouple}
                onChange={(e) => setContent({ ...content, aboutCouple: e.target.value })}
                placeholder="Наша история..."
                className="input"
              />
            </Field>
            <Field label="Дресс-код">
              <input
                value={content.dressCode}
                onChange={(e) => setContent({ ...content, dressCode: e.target.value })}
                placeholder="Элегантный casual"
                className="input"
              />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-wider text-stone-500">Программа дня</label>
                <button
                  onClick={() => setContent({ ...content, program: [...content.program, { time: '', title: '', description: '' }] })}
                  className="text-xs text-stone-600 hover:text-stone-900"
                >
                  + Добавить этап
                </button>
              </div>
              <div className="space-y-2">
                {content.program.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => {
                        const next = [...content.program];
                        next[i] = { ...next[i], time: e.target.value };
                        setContent({ ...content, program: next });
                      }}
                      className="input w-32"
                    />
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const next = [...content.program];
                        next[i] = { ...next[i], title: e.target.value };
                        setContent({ ...content, program: next });
                      }}
                      placeholder="Церемония"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => {
                        setContent({ ...content, program: content.program.filter((_, idx) => idx !== i) });
                      }}
                      className="px-3 text-stone-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Подпись в конце">
              <input
                value={content.footer}
                onChange={(e) => setContent({ ...content, footer: e.target.value })}
                placeholder="С нетерпением ждём! Асет и Айым"
                className="input"
              />
            </Field>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={saveContent} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Сохранить тексты
            </button>
          </div>
        </Card>
      )}

      {tab === 'guests' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-medium text-stone-800">Гости ({guests.length})</h2>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              {bulkMode ? 'Одиночный режим' : 'Массовое добавление'}
            </button>
          </div>

          {invitation.status !== 'published' && (
            <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
              Опубликуйте приглашение, чтобы добавлять гостей и отправлять им ссылки.
            </div>
          )}

          {!bulkMode ? (
            <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-2 mb-5">
              <input
                value={newGuest.name}
                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                placeholder="Имя гостя"
                className="input"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
              />
              <input
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                placeholder="+7 700 ..."
                className="input md:w-40"
              />
              <select
                value={newGuest.side}
                onChange={(e) => setNewGuest({ ...newGuest, side: e.target.value as any })}
                className="input md:w-32"
              >
                <option value="">Сторона</option>
                <option value="bride">Невеста</option>
                <option value="groom">Жених</option>
              </select>
              <button onClick={handleAddGuest} className="btn-primary whitespace-nowrap">
                + Добавить
              </button>
            </div>
          ) : (
            <div className="mb-5">
              <p className="text-sm text-stone-500 mb-2">
                Каждый гость на новой строке. Можно указать телефон через «|»:
                <br />
                <code className="text-xs bg-stone-100 px-2 py-0.5 rounded">Айдос | +77001234567</code>
              </p>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Айдос\nАлия | +77001234567\nТимур'}
                className="input"
              />
              <button onClick={handleBulkAdd} className="btn-primary mt-3">
                + Добавить всех
              </button>
            </div>
          )}

          {guests.length === 0 ? (
            <p className="text-center py-12 text-stone-400 text-sm">Гости пока не добавлены</p>
          ) : (
            <div className="divide-y divide-stone-100 -mx-6">
              {guests.map((g) => (
                <div key={g.id} className="px-6 py-3 flex items-center justify-between hover:bg-stone-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium">
                      {g.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{g.name}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        {g.phone && <span>{g.phone}</span>}
                        {g.side && <span>· {g.side === 'bride' ? 'Невеста' : 'Жених'}</span>}
                        {g.hasPlusOne && g.plusOneName && <span>· +{g.plusOneName}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGuest(g.id)}
                    className="text-xs text-stone-400 hover:text-rose-500 px-2"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-stone-100">
            <p className="text-xs text-stone-400 mb-2">Опасная зона</p>
            <button
              onClick={archive}
              className="text-sm text-rose-500 hover:text-rose-700"
            >
              Архивировать приглашение
            </button>
          </div>
        </Card>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid rgb(231 229 228);
          font-size: 14px;
          background: white;
          transition: border-color 0.15s;
        }
        :global(textarea.input) {
          height: auto;
          padding: 12px 16px;
        }
        :global(.input:focus) {
          outline: none;
          border-color: rgb(168 162 158);
        }
        :global(.btn-primary) {
          height: 44px;
          padding: 0 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          background: linear-gradient(135deg, #1a1a1a 0%, #111 100%);
          display: inline-flex;
          align-items: center;
          transition: opacity 0.15s;
        }
        :global(.btn-primary:hover) {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl p-6 border border-stone-100">{children}</div>;
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}
