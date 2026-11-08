'use client';
import { useState } from 'react';

type MiniEntry = { id: string; question: string; answer: string };

export function MiniFAQ({ entries, title }: { entries: MiniEntry[]; title?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (entries.length === 0) return null;
  return (
    <section className="surface p-4">
      {title && <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>}
      <div className="space-y-1">
        {entries.map((e) => (
          <div key={e.id}>
            <button onClick={() => setOpenId(openId === e.id ? null : e.id)} className="flex w-full items-start justify-between gap-2 py-2 text-left text-[13px] font-medium text-ink">
              <span className="flex-1">{e.question}</span>
              <span className="text-slate-400">{openId === e.id ? '−' : '+'}</span>
            </button>
            {openId === e.id && <p className="pb-2 text-[12px] text-slate-600">{e.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

