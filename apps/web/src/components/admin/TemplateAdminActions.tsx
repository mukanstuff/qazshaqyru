'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

interface Props {
  id: string;
  slug: string;
  isPublic: boolean;
}

export function TemplateAdminActions({ id, slug, isPublic }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка клонирования');
      toast({ title: 'Успешно', description: 'Шаблон клонирован' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось клонировать',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) throw new Error('Ошибка');
      toast({ title: 'Успешно', description: isPublic ? 'Шаблон скрыт' : 'Шаблон опубликован' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить этот шаблон?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      toast({ title: 'Успешно', description: 'Шаблон удалён' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2"
        onClick={() => router.push(`/admin/templates/builder?id=${id}`)}
      >
        Конструктор
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2"
        onClick={handleClone}
        disabled={loading}
      >
        Клонировать
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2"
        onClick={handleToggleHide}
        disabled={loading}
      >
        {isPublic ? 'Скрыть' : 'Показать'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs px-2 text-us-danger hover:bg-us-danger/10"
        onClick={handleDelete}
        disabled={loading}
      >
        Удалить
      </Button>
    </div>
  );
}
