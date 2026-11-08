'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

type FAQEntry = {
  id: string;
  category: 'account' | 'documents' | 'billing' | 'technical' | 'legal';
  order: number;
  locale: 'FR' | 'EN';
  question: string;
  answer: string;
  isPublished: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
};

const CATEGORIES = ['account', 'documents', 'billing', 'technical', 'legal'] as const;

export default function AdminFAQPage() {
  const toast = useToast();
  const [entries, setEntries] = useState<FAQEntry[] | null>(null);
  const [editing, setEditing] = useState<FAQEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [form, setForm] = useState({
    category: 'account' as (typeof CATEGORIES)[number],
    order: 0,
    locale: 'FR' as 'FR' | 'EN',
    question: '',
    answer: '',
    isPublished: true,
  });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetch('/api/admin/faq')
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => toast.show('Erreur de chargement', 'error'));
  }, [refresh, toast]);

  const save = async () => {
    try {
      const url = editing ? `/api/admin/faq/${editing.id}` : '/api/admin/faq';
      const method = editing ? 'PATCH' : 'POST';
      const body = editing
        ? {
            category: form.category,
            order: Number(form.order),
            question: form.question,
            answer: form.answer,
            isPublished: form.isPublished,
          }
        : {
            category: form.category,
            order: Number(form.order),
            locale: form.locale,
            question: form.question,
            answer: form.answer,
            isPublished: form.isPublished,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.show('Erreur lors de l’enregistrement', 'error');
        return;
      }

      toast.show(editing ? 'FAQ modifiée' : 'FAQ créée', 'success');
      setEditing(null);
      setCreating(false);
      setRefresh((r) => r + 1);
    } catch {
      toast.show('Erreur réseau', 'error');
    }
  };

  const togglePublish = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/faq/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ isPublished }),
      });
      if (res.ok) {
        toast.show(isPublished ? 'Publiée' : 'Dépubliée', 'success');
        setRefresh((r) => r + 1);
      } else {
        toast.show('Erreur', 'error');
      }
    } catch {
      toast.show('Erreur réseau', 'error');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer définitivement cette question ?')) return;
    try {
      const res = await fetch(`/api/admin/faq/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'fetch' },
      });
      if (res.ok) {
        toast.show('Supprimée', 'success');
        setRefresh((r) => r + 1);
      } else {
        toast.show('Erreur suppression', 'error');
      }
    } catch {
      toast.show('Erreur réseau', 'error');
    }
  };

  if (entries === null) return <SkeletonList rows={5} />;

  const filtered = entries.filter((e) => {
    const matchCat = filterCat === 'all' || e.category === filterCat;
    const matchLoc = filterLocale === 'all' || e.locale === filterLocale;
    return matchCat && matchLoc;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gestion de la FAQ</h1>
          <p className="text-sm text-slate-500">
            {entries.length} question(s) enregistrée(s)
          </p>
        </div>
        <Button
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm({
              category: 'account',
              order: entries.length,
              locale: 'FR',
              question: '',
              answer: '',
              isPublished: true,
            });
          }}
        >
          + Nouvelle question
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded border px-2 py-1 text-sm bg-white"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterLocale}
          onChange={(e) => setFilterLocale(e.target.value)}
          className="rounded border px-2 py-1 text-sm bg-white"
        >
          <option value="all">Toutes langues</option>
          <option value="FR">FR</option>
          <option value="EN">EN</option>
        </select>
      </div>

      {(creating || editing) && (
        <Card>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {editing ? 'Modifier la question' : 'Nouvelle question'}
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as (typeof CATEGORIES)[number] })}
                  className="w-full rounded border px-2 py-1.5 text-sm bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">{"Ordre d'affichage"}</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full rounded border px-2 py-1.5 text-sm"
                />
              </div>
              {!editing && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Langue</label>
                  <select
                    value={form.locale}
                    onChange={(e) => setForm({ ...form, locale: e.target.value as 'FR' | 'EN' })}
                    className="w-full rounded border px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="FR">FR</option>
                    <option value="EN">EN</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Question</label>
              <input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Ex : Comment télécharger une facture en PDF ?"
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Réponse (Markdown)</label>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Réponse formatée en Markdown..."
                rows={10}
                className="w-full rounded border px-2 py-1.5 font-mono text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded"
              />
              <span>Publier immédiatement cette question</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button onClick={save}>Enregistrer</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((e) => (
          <Card key={e.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-medium">
                    {e.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Ordre: {e.order} · {e.locale}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      e.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {e.isPublished ? 'Publié' : 'Brouillon'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    👍 {e.helpful} / 👎 {e.notHelpful}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">{e.question}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{e.answer}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(e);
                    setCreating(false);
                    setForm({
                      category: e.category,
                      order: e.order,
                      locale: e.locale,
                      question: e.question,
                      answer: e.answer,
                      isPublished: e.isPublished,
                    });
                  }}
                >
                  Éditer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePublish(e.id, !e.isPublished)}
                >
                  {e.isPublished ? 'Dépublier' : 'Publier'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => remove(e.id)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucune question trouvée.
          </div>
        )}
      </div>
    </div>
  );
}

