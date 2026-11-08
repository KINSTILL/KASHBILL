import { useTranslations } from 'next-intl';

export function Features() {
  const t = useTranslations('landing.features');

  const features = [
    { title: t('f1_title'), desc: t('f1_desc'), icon: '⚖️' },
    { title: t('f2_title'), desc: t('f2_desc'), icon: '💳' },
    { title: t('f3_title'), desc: t('f3_desc'), icon: '📲' },
    { title: t('f4_title'), desc: t('f4_desc'), icon: '📈' },
    { title: t('f5_title'), desc: t('f5_desc'), icon: '⚡' },
    { title: t('f6_title'), desc: t('f6_desc'), icon: '🔒' },
  ];

  return (
    <section id="features" className="bg-slate-50 py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
