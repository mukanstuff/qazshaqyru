'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/constants';

/**
 * Password section of /settings.
 *
 * /settings only ever edited name and language, so there was no way to change a
 * password anywhere in the product — and with no verification channel there is
 * no reset flow either, which made a forgotten or shared password permanent.
 *
 * `hasPassword=false` (a Google-only account) turns this into "set a password",
 * which is also how such a user gains phone sign-in.
 */
export function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(hasPassword ? { currentPassword: current } : {}),
          newPassword: next,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message || t('common.error'));
      setCurrent('');
      setNext('');
      toast({ title: t('settings.passwordSaved') });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-6 overflow-hidden border-us-border/80 shadow-us-md">
      <CardHeader className="border-b border-us-border/70 bg-gradient-to-br from-us-accent/8 via-us-surface to-us-surface">
        <CardTitle className="font-display text-xl">
          {hasPassword ? t('settings.passwordTitle') : t('settings.passwordSetTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          {!hasPassword ? (
            <p className="font-body text-sm text-us-ink-muted">{t('settings.passwordSetHint')}</p>
          ) : null}

          {hasPassword ? (
            <div className="space-y-2">
              <Label htmlFor="current-password">{t('settings.passwordCurrent')}</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('settings.passwordNew')}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <p className="font-body text-xs text-us-ink-muted">
              {t('auth.passwordHint', { min: MIN_PASSWORD_LENGTH })}
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving || next.length < MIN_PASSWORD_LENGTH || (hasPassword && !current)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('settings.passwordSubmit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
