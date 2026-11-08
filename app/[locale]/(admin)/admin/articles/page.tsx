'use client';

import { useEffect, useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

type Article = {
  id: string;
  slug: string;
  locale: 'FR' | 'EN';
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  authorName: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  readingTime: number;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export default function AdminArticlesPage() {
  const toast = useToast();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [refresh, setRefresh] = useState(0);

  const initialForm = {
    locale: 'FR' as 'FR' | 'EN',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverUrl: '',
    authorName: 'Équipe MyCashBill',
    tagsString: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    publishedAt: '',
    seoTitle: '',
    seoDescription: '',
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetch('/api/admin/articles')
      .then((r) => r.json())
      .then((d) => setArticles(d.articles ?? []))
      .catch(() => toast.show('Erreur lors du chargement des articles', 'error'));
  }, [refresh, toast]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setPreviewTab('edit');
    setCreating(true);
  };

  const openEdit = (art: Article) => {
    setCreating(false);
    setEditing(art);
    setForm({
      locale: art.locale,
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      content: art.content,
      coverUrl: art.coverUrl ?? '',
      authorName: art.authorName,
      tagsString: art.tags.join(', '),
      status: art.status,
      publishedAt: art.publishedAt ? art.publishedAt.slice(0, 16) : '',
      seoTitle: art.seoTitle ?? '',
      seoDescription: art.seoDescription ?? '',
    });
    setPreviewTab('edit');
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
  };

  const save = async (forcedStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    if (!form.title.trim() || !form.content.trim() || !form.excerpt.trim()) {
      toast.show('Veuillez remplir le titre, l’extrait et le contenu.', 'error');
      return;
    }

    const tags = form.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const targetStatus = forcedStatus ?? form.status;

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      locale: form.locale,
      excerpt: form.excerpt.trim(),
      content: form.content,
      coverUrl: form.coverUrl.trim() || null,
      authorName: form.authorName.trim() || 'Équipe MyCashBill',
      tags,
      status: targetStatus,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
    };

    try {
      const url = editing ? `/api/admin/articles/${editing.id}` : '/api/admin/articles';
      const method = editing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.show(errData.message || 'Erreur lors de l’enregistrement', 'error');
        return;
      }

      toast.show(editing ? 'Article mis à jour' : 'Article créé', 'success');
      closeForm();
      setRefresh((r) => r + 1);
    } catch {
      toast.show('Erreur réseau', 'error');
    }
  };

  const deleteArticle = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement l'article "${title}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'fetch' },
      });

      if (res.ok) {
        toast.show('Article supprimé', 'success');
        if (editing?.id === id) closeForm();
        setRefresh((r) => r + 1);
      } else {
        toast.show('Erreur lors de la suppression', 'error');
      }
    } catch {
      toast.show('Erreur réseau', 'error');
    }
  };

  const changeStatus = async (art: Article, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      const res = await fetch(`/api/admin/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.show(`Statut mis à jour : ${status}`, 'success');
        setRefresh((r) => r + 1);
      } else {
        toast.show('Erreur lors de la mise à jour du statut', 'error');
      }
    } catch {
      toast.show('Erreur réseau', 'error');
    }
  };

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    return articles.filter((a) => {
      const matchLocale = filterLocale === 'all' || a.locale === filterLocale;
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.slug.toLowerCase().includes(search.toLowerCase());
      return matchLocale && matchStatus && matchSearch;
    });
  }, [articles, filterLocale, filterStatus, search]);

  const sanitizedPreviewHtml = useMemo(() => {
    if (!form.content) return '';
    try {
      const raw = marked.parse(form.content) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return '<p class="text-red-500">Erreur de rendu Markdown</p>';
    }
  }, [form.content]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Articles du Blog</h1>
          <p className="text-sm text-slate-500">
            Gestion des publications, guides SEO et articles publics
          </p>
        </div>
        <Button onClick={openCreate} className="bg-sage-600 hover:bg-sage-700 text-white">
          + Nouvel article
        </Button>
      </div>

      {/* Modal / Formulaire d'édition */}
      {(creating || editing) && (
        <Card className="p-6 border-sage-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? `Modifier l'article : ${editing.title}` : 'Créer un article'}
            </h2>
            <button
              onClick={closeForm}
              className="text-slate-400 hover:text-slate-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm focus:border-sage-500"
                placeholder="Ex: Comment bien facturer ses clients au Cameroun"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Slug (laisser vide pour auto-génération)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="ex: comment-bien-facturer-ses-clients"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Langue *</label>
              <select
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value as 'FR' | 'EN' })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              >
                <option value="FR">Français (FR)</option>
                <option value="EN">Anglais (EN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Statut *</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              >
                <option value="DRAFT">Brouillon (DRAFT)</option>
                <option value="PUBLISHED">Publié (PUBLISHED)</option>
                <option value="ARCHIVED">Archivé (ARCHIVED)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Auteur</label>
              <input
                type="text"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={form.tagsString}
                onChange={(e) => setForm({ ...form, tagsString: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="facturation, entreprise, tva"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">URL Image Cover</label>
              <input
                type="url"
                value={form.coverUrl}
                onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Extrait / Résumé (Excerpt) *
              </label>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Bref résumé accrocheur pour la liste et le SEO..."
              />
            </div>

            {/* Contenu Markdown avec Onglets Édition / Preview */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Contenu Markdown *
                </label>
                <div className="flex gap-1 rounded bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('edit')}
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      previewTab === 'edit'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✏️ Éditeur
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      previewTab === 'preview'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👁️ Aperçu rendu
                  </button>
                </div>
              </div>

              {previewTab === 'edit' ? (
                <textarea
                  rows={12}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded border border-slate-300 p-3 font-mono text-sm leading-relaxed"
                  placeholder="## Mon premier titre&#10;&#10;Contenu de l'article en Markdown..."
                />
              ) : (
                <div className="min-h-[300px] rounded border border-slate-200 bg-slate-50 p-4">
                  {sanitizedPreviewHtml ? (
                    <div
                      className="prose prose-sm max-w-none prose-headings:text-ink"
                      dangerouslySetInnerHTML={{ __html: sanitizedPreviewHtml }}
                    />
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucun contenu à prévisualiser.</p>
                  )}
                </div>
              )}
            </div>

            {/* Champs SEO */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Titre SEO (optionnel)</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Description SEO (optionnelle)
              </label>
              <input
                type="text"
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => save()}
                className="bg-sage-600 hover:bg-sage-700 text-white"
              >
                Enregistrer
              </Button>
              {form.status !== 'PUBLISHED' && (
                <Button
                  type="button"
                  onClick={() => save('PUBLISHED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  🚀 Publier immédiatement
                </Button>
              )}
              {form.status === 'PUBLISHED' && (
                <Button
                  type="button"
                  onClick={() => save('ARCHIVED')}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  📦 Archiver
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeForm}>
                Annuler
              </Button>
            </div>

            {editing && (
              <Button
                type="button"
                onClick={() => deleteArticle(editing.id, editing.title)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Supprimer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Barre de Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Rechercher par titre ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
        />

        <select
          value={filterLocale}
          onChange={(e) => setFilterLocale(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          <option value="all">Toutes les langues</option>
          <option value="FR">Français (FR)</option>
          <option value="EN">Anglais (EN)</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          <option value="all">Tous les statuts</option>
          <option value="PUBLISHED">Publiés</option>
          <option value="DRAFT">Brouillons</option>
          <option value="ARCHIVED">Archivés</option>
        </select>
      </div>

      {/* Liste des articles */}
      {articles === null ? (
        <SkeletonList rows={4} />
      ) : filteredArticles.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-8 text-center">
          Aucun article trouvé pour ces critères.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="p-3">Article</th>
                <th className="p-3">Langue</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Vues</th>
                <th className="p-3">Date pub.</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map((art) => {
                const statusBadge =
                  art.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : art.status === 'ARCHIVED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700';

                return (
                  <tr key={art.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{art.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">/{art.slug}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700">{art.locale}</span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge}`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{art.views}</td>
                    <td className="p-3">
                      {art.publishedAt
                        ? new Date(art.publishedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(art)}
                          className="rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Modifier
                        </button>

                        {art.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => changeStatus(art, 'PUBLISHED')}
                            className="rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Publier
                          </button>
                        )}

                        {art.status === 'PUBLISHED' && (
                          <button
                            onClick={() => changeStatus(art, 'ARCHIVED')}
                            className="rounded px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            Archiver
                          </button>
                        )}

                        <button
                          onClick={() => deleteArticle(art.id, art.title)}
                          className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
