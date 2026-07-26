'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export function LogoutButton() {
  const router = useRouter();
  const { t } = useI18n();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleLogout}
      className="text-us-ink-muted hover:bg-us-accent/6 hover:text-us-accent"
      aria-label={t('auth.logout')}
    >
      <LogOut />
    </Button>
  );
}
