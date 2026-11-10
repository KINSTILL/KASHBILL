import { useTranslations } from 'next-intl';

export function ProblemSection() {
  const t = useTranslations('landing.problem');

  const problems = [
    {
      title: t('word_title'),
      desc: t('word_desc'),
    },
    {
      title: t('excel_title'),
      desc: t('excel_desc'),
    },
    {
      title: t('paper_title'),
      desc: t('paper_desc'),
    },
  ];

  return (
    <section className="bg-slate-50 py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-ink md:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {problems.map((p, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                <span>❌</span>
                <span>{p.title}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            {t('transition')}
          </p>
        </div>
      </div>
    </section>
  );
}
