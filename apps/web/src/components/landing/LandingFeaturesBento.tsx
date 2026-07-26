'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, MapPin, Share2, Users } from 'lucide-react';

import { useI18n } from '@/i18n';

const DEMO_EVENT = new Date('2026-08-22T17:00:00+05:00');

function BentoShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1.75rem] border border-us-accent/10 bg-white p-5 shadow-[0_20px_40px_-20px_rgba(44,24,16,0.12)] md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function RsvpPreview() {
  const { t } = useI18n();
  const names = useMemo(
    () => [
      { id: '1', name: 'Аида С.', status: 'yes' as const },
      { id: '2', name: 'Болат Н.', status: 'yes' as const },
      { id: '3', name: 'Гульнара А.', status: 'yes' as const },
      { id: '4', name: 'Данияр С.', status: 'pending' as const },
    ],
    [],
  );
  const [order, setOrder] = useState(names);

  useEffect(() => {
    const id = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) next.unshift(last);
        return next;
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {order.map((item) => (
          <motion.div
            key={item.id}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="flex items-center justify-between rounded-xl bg-us-cream/80 px-3 py-2"
          >
            <span className="text-xs font-medium text-us-ink">{item.name}</span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                item.status === 'yes' ? 'text-green-700' : 'text-us-ink-muted'
              }`}
            >
              {item.status === 'yes' ? <Check className="h-3 w-3" /> : null}
              {item.status === 'yes' ? t('landing.v2.features.rsvpTitle') : '...'}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function TimerPreview() {
  const [parts, setParts] = useState({ days: '—', hours: '—', mins: '—' });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, DEMO_EVENT.getTime() - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setParts({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        mins: String(mins).padStart(2, '0'),
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const labels = ['дней', 'часов', 'мин'] as const;
  const values = [parts.days, parts.hours, parts.mins];

  return (
    <div className="flex justify-center gap-2 py-2">
      {values.map((value, i) => (
        <div key={labels[i]} className="rounded-xl bg-us-accent/8 px-3 py-2 text-center">
          <div className="font-display text-2xl text-us-accent">{value}</div>
          <div className="text-[9px] uppercase tracking-wider text-us-ink-muted">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function MapPreview() {
  return (
    <div className="relative h-28 overflow-hidden rounded-xl">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/landing/toy-astana-wedding.jpg')" }}
      />
      <div className="absolute inset-0 bg-us-ink/45" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-1/4 top-1/3 h-px w-2/3 bg-white/30" />
        <div className="absolute left-1/3 top-1/2 h-px w-1/2 bg-white/20" />
      </div>
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
        <MapPin className="h-6 w-6 text-us-gold" />
        <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-us-ink">
          Rixos Almaty
        </span>
      </div>
    </div>
  );
}

function WishesPreview() {
  const wishes = ['Бақытты болыңдар!', 'Жанұяларыңыз бақытты болсын', 'Тойларыңыз қуанышты болсын!'];
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const full = wishes[idx];
    if (typing) {
      if (text.length < full.length) {
        const id = setTimeout(() => setText(full.slice(0, text.length + 1)), 55);
        return () => clearTimeout(id);
      }
      const id = setTimeout(() => setTyping(false), 1400);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setText('');
      setTyping(true);
      setIdx((i) => (i + 1) % wishes.length);
    }, 900);
    return () => clearTimeout(id);
  }, [idx, text, typing, wishes]);

  return (
    <div className="space-y-2">
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-us-cream px-3 py-2 text-[11px] text-us-ink">
        {text}
        <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-us-accent" />
      </div>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-us-accent/10 px-3 py-2 text-[11px] text-us-ink-muted">
        ...
      </div>
    </div>
  );
}

function GuestsPreview() {
  const [count, setCount] = useState(41);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c >= 47 ? 41 : c + 1));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="flex -space-x-2">
        {['ДС', 'АЖ', 'АН', `+${count - 3}`].map((label) => (
          <span
            key={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-us-accent text-[10px] font-semibold text-white"
          >
            {label}
          </span>
        ))}
      </div>
      <motion.span
        key={count}
        initial={{ scale: 1.15, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-display text-2xl text-us-accent"
      >
        {count}
      </motion.span>
    </div>
  );
}

export function LandingFeaturesBento() {
  const { t } = useI18n();

  const tiles = [
    {
      key: 'rsvp',
      span: 'md:col-span-2 md:row-span-2',
      preview: <RsvpPreview />,
    },
    {
      key: 'timer',
      span: '',
      preview: <TimerPreview />,
    },
    {
      key: 'map',
      span: '',
      preview: <MapPreview />,
    },
    {
      key: 'wishes',
      span: '',
      preview: <WishesPreview />,
    },
    {
      key: 'whatsapp',
      span: '',
      preview: (
        <div className="flex items-center justify-center py-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white">
            <Share2 className="h-3.5 w-3.5" />
            WhatsApp
          </div>
        </div>
      ),
    },
    {
      key: 'guests',
      span: '',
      preview: <GuestsPreview />,
    },
  ] as const;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="us-overline mb-5">{t('landing.v2.features.overline')}</p>
          <h2 className="font-display text-4xl text-us-ink md:text-5xl">
            {t('landing.v2.features.title')}{' '}
            <span className="text-us-accent">{t('landing.v2.features.titleAccent')}</span>
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(120px,auto)]">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.key}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className={tile.span}
            >
              <BentoShell className="flex h-full flex-col">
                <div className="mb-3 flex-1">{tile.preview}</div>
                <div>
                  <h3 className="font-semibold text-us-ink">
                    {t(`landing.v2.features.${tile.key}Title`)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-us-ink-muted">
                    {t(`landing.v2.features.${tile.key}Desc`)}
                  </p>
                </div>
              </BentoShell>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
