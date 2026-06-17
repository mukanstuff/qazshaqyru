'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Loader2, LogOut, Plus, Heart } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-stone-200 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-stone-400 rounded-full animate-spin" />
          </div>
          <p className="text-stone-400 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
        style={{ borderColor: '#e7e5e4' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/dashboard" className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
              <span
                className="text-lg font-medium text-stone-800 tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Invito
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a
                href="/dashboard"
                className="text-stone-500 hover:text-stone-800 transition-colors"
              >
                Мои приглашения
              </a>
              <a
                href="/invitations/new"
                className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Создать
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-stone-400 hidden sm:block">
              {user.phone}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
