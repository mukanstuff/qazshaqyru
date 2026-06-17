'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

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
    <button
      onClick={handleLogout}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
      aria-label="Выйти"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
