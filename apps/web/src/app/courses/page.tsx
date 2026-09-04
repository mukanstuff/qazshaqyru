import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getI18n } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t('site.meta.courses'),
    description: t('site.meta.coursesDescription'),
    robots: { index: false, follow: false },
  };
}

// 2026-08-16: /course content was fabricated copy — concrete prices
// (49 990 / 79 990 ₸), "8 video-lessons", "lifetime access",
// "curator chat", "certificate" all referenced a course that does
// not exist. There is no Course model, no payment flow, no LMS.
// Send users to the real catalog until a real course is built.
export default function CoursesPage() {
  redirect('/templates');
}
