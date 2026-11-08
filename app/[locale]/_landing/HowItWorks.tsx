import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('landing.how');

  const steps = [
    {
      title: t('step1_title'),
      desc: t('step1_desc'),
      icon: '✍️',
    },
    {
      title: t('step2_title'),
      desc: t('step2_desc'),
      icon: '⚡',
    },
    {
      title: t('step3_title'),
      desc: t('step3_desc'),
      icon: '💬',
    },
  ];

  return (
    <section className="bg-white py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl shadow-sm">
                {s.icon}
              </div>
              <h3 className="mt-5 text-base font-bold text-ink">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
