'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GuestInvitationPage } from '@/app/i/[slug]/GuestInvitationPage';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';

interface Props {
  templateSlug: string;
  backHref: string;
}

export function PreviewShell({ templateSlug, backHref }: Props) {
  const router = useRouter();
  const [demoLayout, setDemoLayout] = useState<string | null>(templateSlug);

  if (!demoLayout) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f10] text-white">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm transition hover:bg-white/5"
          >
            ← Назад
          </Link>
          <span className="text-sm text-white/60">
            Превью · <code className="text-white/80">{templateSlug}</code>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/i/demo?layout=${templateSlug}`)}
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm transition hover:bg-white/5"
          >
            Редактировать
          </button>
          <button
            onClick={() => {
              try {
                const raw = localStorage.getItem('qazshaqyru:saved-templates');
                const list = raw ? (JSON.parse(raw) as string[]) : [];
                if (!list.includes(templateSlug)) {
                  list.push(templateSlug);
                  localStorage.setItem('qazshaqyru:saved-templates', JSON.stringify(list));
                }
                window.alert('Шаблон сохранён');
              } catch {
                window.alert('Не удалось сохранить');
              }
            }}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Сохранить
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <GuestInvitationPage
          slug="demo"
          guestToken={null}
          familyToken={null}
          demoLayout={demoLayout}
          suppressGuestChrome
        />
      </main>
    </div>
  );
}