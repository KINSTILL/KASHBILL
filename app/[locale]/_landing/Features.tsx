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
    <section id="features" className="bg-white py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-ink md:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-50 text-xl">{f.icon}</div>
              <h3 className="mt-3 text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
