'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/use-auth';
import { AppHeader } from '@/components/shared/AppHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/shared/utils';

const selectClassName = cn(
  'flex h-10 w-full rounded-md border border-us-border bg-us-surface px-3 py-2 font-body text-sm text-us-ink shadow-us-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent focus-visible:ring-offset-2 focus-visible:ring-offset-us-ivory'
);

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'ru' | 'kz'>('ru');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setLanguage(user.language);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div>
        <AppHeader />
        <div className="us-container pb-8 pt-24 lg:pb-12 lg:pt-28">
          <div className="mx-auto grid w-full max-w-2xl gap-4 md:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-us-border bg-us-surface p-5 shadow-us-sm">
              <div className="h-5 w-36 animate-pulse rounded-full bg-us-border/50" />
              <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-us-border/40" />
              <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-us-border/40" />
              <div className="mt-3 h-11 w-2/3 animate-pulse rounded-xl bg-us-border/40" />
            </div>
            <div className="rounded-2xl border border-us-border bg-us-surface p-5 shadow-us-sm">
              <div className="h-5 w-28 animate-pulse rounded-full bg-us-border/50" />
              <div className="mt-4 h-36 animate-pulse rounded-2xl bg-us-border/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || t('common.error'));
      }
      if (language !== locale) setLocale(language);
      await refreshSession();
      toast({ title: t('settings.saved') });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error');
      toast({ title: t('common.error'), description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AppHeader />
      <div className="us-container pb-8 pt-24 lg:pb-12 lg:pt-28">
        <div className="mx-auto w-full max-w-lg">
          <Button variant="link" className="mb-6 h-auto p-0" asChild>
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>

          <Card className="overflow-hidden border-us-border/80 shadow-us-md">
            <CardHeader className="border-b border-us-border/70 bg-gradient-to-br from-us-accent/8 via-us-surface to-us-surface">
              <CardTitle className="font-display text-2xl">{t('settings.title')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input id="phone" value={user.phone} disabled readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('settings.namePlaceholder')}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t('settings.language')}</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'ru' | 'kz')}
                    className={selectClassName}
                  >
                    <option value="ru">{t('settings.langRu')}</option>
                    <option value="kz">{t('settings.langKz')}</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      t('settings.save')
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
                    {t('common.back')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
