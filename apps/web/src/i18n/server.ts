import { cookies } from 'next/headers';
import { detectLocaleFromString, tForLocale, type Locale } from './index';
import { ru } from './messages/ru';
import { kz } from './messages/kz';

const ALL_MESSAGES: Record<Locale, Record<string, unknown>> = {
  ru: ru as Record<string, unknown>,
  kz: kz as Record<string, unknown>,
};

export async function getI18n(): Promise<{
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
}> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const locale = detectLocaleFromString(cookieLocale);

  const t = (key: string, vars?: Record<string, string | number>) => {
    let text = tForLocale(locale, key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };

  return { locale, t };
}
