'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

type Entry = { id: string; category: string; question: string; answer: string; helpful: number; notHelpful: number };

const CATEGORIES = ['account', 'documents', 'billing', 'technical', 'legal'] as const;

export function FAQClient({ entries, locale: _locale }: { entries: Entry[]; locale: string }) {
  const t = useTranslations('faq');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = entries.filter((e) => {
    const matchSearch = !search || e.question.toLowerCase().includes(search.toLowerCase()) || e.answer.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || e.category === activeCategory;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.category] ||= []).push(e);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">FAQ</h1>
      <p className="mt-2 text-slate-600">{t('subtitle')}</p>

      <input type="search" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="mt-6 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm" />

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setActiveCategory(null)} className={`chat-pill ${!activeCategory ? 'chat-pill-active' : ''}`}>{t('all')}</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setActiveCategory(c)} className={`chat-pill ${activeCategory === c ? 'chat-pill-active' : ''}`}>{t(`cat.${c}`)}</button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {Object.entries(grouped).map(([cat, list]) => (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">{t(`cat.${cat}`)}</h2>
            <div className="space-y-2">
              {list.map((e) => (
                <div key={e.id} className="surface overflow-hidden">
                  <button onClick={() => setOpenId(openId === e.id ? null : e.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                    <span className="flex-1 text-sm font-semibold text-ink">{e.question}</span>
                    <span className="text-slate-400">{openId === e.id ? '−' : '+'}</span>
                  </button>
                  {openId === e.id && (
                    <div className="border-t border-slate-100 px-4 py-3">
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(e.answer) as string) }} />
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span>{t('helpful')}</span>
                        <button onClick={() => fetch(`/api/faq/${e.id}/feedback`, { method: 'POST', headers: { 'X-Requested-With': 'fetch', 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful: true }) })} className="rounded bg-slate-100 px-2 py-1 hover:bg-green-100">👍 {e.helpful}</button>
                        <button onClick={() => fetch(`/api/faq/${e.id}/feedback`, { method: 'POST', headers: { 'X-Requested-With': 'fetch', 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful: false }) })} className="rounded bg-slate-100 px-2 py-1 hover:bg-red-100">👎 {e.notHelpful}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: entries.slice(0, 20).map((e) => ({ '@type': 'Question', name: e.question, acceptedAnswer: { '@type': 'Answer', text: e.answer.replace(/[#*_`]/g, '') } })) }) }} />
    </main>
  );
}
