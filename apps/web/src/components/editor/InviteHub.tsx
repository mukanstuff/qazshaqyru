'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, MessageCircle, QrCode, Sparkles, PencilLine, Users, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import { PaymentStatusBanner } from '@/components/orders/PaymentStatusBanner';
import { PaymentPendingBanner } from '@/components/dashboard/PaymentPendingBanner';
import { buildInviteShareMessage, buildPublicInviteUrl, buildWhatsAppShareUrl } from '@/lib/invitations/share-url';

interface InviteHubProps {
  invitationSlug: string;
  invitationTitle: string;
  templateKey: string;
  status: 'draft' | 'published' | 'archived';
  guestCount: number;
  respondedYes: number;
  respondedNo: number;
  pendingResponses: number;
  isPublished: boolean;
  priceKzt: number;
  editHref: string;
  showPublishedBanner?: boolean;
  showPaymentFailed?: boolean;
  showPaymentInvalid?: boolean;
  showPaymentPending?: boolean;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export function InviteHub({
  invitationSlug,
  invitationTitle,
  templateKey,
  status,
  guestCount,
  respondedYes,
  respondedNo,
  pendingResponses,
  isPublished,
  priceKzt,
  editHref,
  showPublishedBanner = false,
  showPaymentFailed = false,
  showPaymentInvalid = false,
  showPaymentPending = false,
}: InviteHubProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const publicUrl = useMemo(() => (typeof window === 'undefined' ? `/i/${invitationSlug}` : buildPublicInviteUrl(window.location.origin, invitationSlug)), [invitationSlug]);
  const shareText = useMemo(() => buildInviteShareMessage(publicUrl, invitationTitle), [publicUrl, invitationTitle]);
  const whatsappUrl = useMemo(() => buildWhatsAppShareUrl(shareText), [shareText]);
  const statusLabel = status === 'published' ? t('dashboard.status.published') : t('dashboard.status.draft');
  const headLabel = isPublished ? t('postPublish.title') : t('invitation.edit.publish');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--us-ivory)]">
      {showPublishedBanner ? <PaymentStatusBanner variant="published" /> : null}
      {!showPublishedBanner && showPaymentFailed ? <PaymentStatusBanner variant="failed" /> : null}
      {!showPublishedBanner && showPaymentInvalid ? <PaymentStatusBanner variant="invalid" /> : null}
      {showPaymentPending ? <PaymentPendingBanner initialPending alwaysPoll /> : null}
      <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <section className="space-y-4">
          <Card className="overflow-hidden shadow-us-sm">
            <CardHeader className="space-y-3 border-b bg-us-ivory/70">
              <div className="flex items-center gap-2 text-us-accent"><Sparkles size={18} /><span className="font-body text-xs font-semibold uppercase tracking-[0.24em]">Invite Hub</span></div>
              <CardTitle className="font-display text-3xl leading-tight">{headLabel}</CardTitle>
              <p className="font-body text-sm text-us-ink-muted">{isPublished ? 'Отправьте ссылку в WhatsApp, покажите QR и быстро увидьте, кто ответил.' : 'Проверьте приглашение, оплатите публикацию и продолжайте править текст в том же мастере.'}</p>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-us-border bg-us-ivory p-4"><div className="mb-2 text-xs uppercase tracking-[0.22em] text-us-ink-muted">Статус</div><div className="text-lg font-semibold text-us-ink">{statusLabel}</div><div className="mt-2 text-sm text-us-ink-muted">Шаблон: {templateKey}</div></div>
              <div className="rounded-2xl border border-us-border bg-us-ivory p-4"><div className="mb-2 text-xs uppercase tracking-[0.22em] text-us-ink-muted">Гости</div><div className="text-lg font-semibold text-us-ink">{guestCount}</div><div className="mt-2 text-sm text-us-ink-muted">Придут {respondedYes} · Не смогут {respondedNo} · Ждём {pendingResponses}</div></div>
            </CardContent>
          </Card>
          <Card className="shadow-us-sm"><CardHeader><CardTitle className="font-display text-2xl">Поделиться</CardTitle></CardHeader><CardContent className="space-y-3"><div className="break-all rounded-xl border border-us-border bg-us-ivory px-3 py-2 font-mono text-xs text-us-ink">{publicUrl}</div><div className="flex flex-wrap gap-2"><Button type="button" onClick={async () => { await copyText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}><Copy size={18} />{copied ? 'Скопировано' : 'Копировать ссылку'}</Button><Button variant="outline" asChild><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} />WhatsApp</a></Button><Button variant="outline" asChild><a href="#qr"><QrCode size={18} />QR</a></Button></div><div className="flex flex-col gap-2 sm:flex-row"><Button className="flex-1" asChild><Link href={editHref}><PencilLine size={18} />Изменить приглашение</Link></Button>{!isPublished ? <Button variant="outline" className="flex-1" asChild><Link href={editHref}>Продолжить в мастере</Link></Button> : null}</div></CardContent></Card>
          <Card className="shadow-us-sm"><CardHeader><CardTitle className="font-display text-2xl">Кто ответил</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-us-border bg-us-ivory p-4"><Users className="mb-2 text-us-accent" size={18} /><div className="text-2xl font-semibold">{respondedYes}</div><div className="text-sm text-us-ink-muted">Придут</div></div><div className="rounded-xl border border-us-border bg-us-ivory p-4"><CircleAlert className="mb-2 text-us-accent" size={18} /><div className="text-2xl font-semibold">{respondedNo}</div><div className="text-sm text-us-ink-muted">Не смогут</div></div><div className="rounded-xl border border-us-border bg-us-ivory p-4"><Sparkles className="mb-2 text-us-accent" size={18} /><div className="text-2xl font-semibold">{pendingResponses}</div><div className="text-sm text-us-ink-muted">Ждём</div></div></CardContent></Card>
        </section>
        <aside className="space-y-4">
          <Card className="shadow-us-sm"><CardHeader><CardTitle className="font-display text-2xl">Превью</CardTitle></CardHeader><CardContent><div id="qr" className="flex justify-center rounded-2xl border border-us-border bg-us-ivory p-4"><QrCodePanel url={publicUrl} label={t('invitation.edit.qrLabel')} /></div></CardContent></Card>
          {!isPublished ? <Card className="shadow-us-sm"><CardContent className="p-4 text-sm text-us-ink-muted">Оплата: {priceKzt} ₸. После публикации ссылка и QR остаются здесь.</CardContent></Card> : null}
        </aside>
      </div>
    </div>
  );
}
