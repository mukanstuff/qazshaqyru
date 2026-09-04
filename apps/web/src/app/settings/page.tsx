'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/use-auth';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/shared/utils';
import { PasswordCard } from './PasswordCard';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';

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
    // Shape matches the loaded card below (single column, one form) — this
    // used to be a two-column skeleton (a shape the real content never has),
    // so the page visibly changed layout the instant it finished loading.
    return (
      <div>
        <SiteHeader isLoggedIn backHref="/dashboard" />
        <div className="us-container pb-8 pt-24 lg:pb-12 lg:pt-28">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-6 h-5 w-16 animate-pulse rounded-full bg-us-border/50" />
            <div className="overflow-hidden rounded-2xl border border-us-border/80 shadow-us-md">
              <div className="border-b border-us-border/70 bg-us-accent/8 p-5">
                <div className="h-7 w-40 animate-pulse rounded-full bg-us-border/50" />
              </div>
              <div className="space-y-4 p-6 pt-6">
                <div className="space-y-2">
                  <div className="h-4 w-16 animate-pulse rounded-full bg-us-border/40" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-us-border/40" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-12 animate-pulse rounded-full bg-us-border/40" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-us-border/40" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-us-border/40" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-us-border/40" />
                </div>
                <div className="h-10 w-28 animate-pulse rounded-md bg-us-border/50" />
              </div>
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
      <SiteHeader isLoggedIn backHref="/dashboard" />
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
                  <Input
                    id="phone"
                    value={user.phone ?? t('settings.phoneNotSet')}
                    disabled
                    readOnly
                  />
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
                </div>
              </form>
            </CardContent>
          </Card>

          <PasswordCard hasPassword={user.hasPassword} />
        </div>
      </div>
      {/* Settings was the one signed-in page with no footer, so the site chrome
          changed shape depending on which page you were on. */}
      <SiteCompactFooter />
    </div>
  );
}
