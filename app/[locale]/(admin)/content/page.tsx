'use client';

import { useEffect, useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

type ContentItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  locale: 'FR' | 'EN';
  tags: string[];
  published: boolean;
  views: number;
  readingTime: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminContentPage() {
  const toast = useToast();
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    category: 'BLOG' as 'BLOG' | 'FAQ',
    locale: 'FR' as 'FR' | 'EN',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    authorName: 'MyCashBill',
    tagsString: '',
    published: false,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetch('/api/admin/articles')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.articles ?? []).map((a: ContentItem) => ({
          ...a,
          category: a.category || 'BLOG',
          published: Boolean(a.published),
        }));
        setItems(list);
      })
      .catch(() => toast.show('Erreur de chargement du contenu', 'error'));
  }, [refresh, toast]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setPreviewTab('edit');
    setCreating(true);
  };

  const openEdit = (item: ContentItem) => {
    setCreating(false);
    setEditing(item);
    setForm({
      category: (item.category as 'BLOG' | 'FAQ') || 'BLOG',
      locale: item.locale,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      authorName: item.authorName || 'MyCashBill',
      tagsString: item.tags?.join(', ') || '',
      published: item.published,
    });
    setPreviewTab('edit');
  };

  const closeEditor = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleTogglePublish = async (item: ContentItem) => {
    const nextPublished = !item.published;
    try {
      const res = await fetch(`/api/admin/articles/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ published: nextPublished }),
      });
      if (!res.ok) throw new Error();
      toast.show(
        nextPublished ? 'Contenu publié en ligne' : 'Contenu repassé en brouillon',
        'success'
      );
      setRefresh((n) => n + 1);
    } catch {
      toast.show('Échec de la modification du statut', 'error');
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Supprimer définitivement "${item.title}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/articles/${item.id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'fetch' },
      });
      if (!res.ok) throw new Error();
      toast.show('Contenu supprimé avec succès', 'success');
      setRefresh((n) => n + 1);
    } catch {
      toast.show('Erreur lors de la suppression', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.show('Le titre et le contenu sont obligatoires', 'error');
      return;
    }

    setSaving(true);
    const tags = form.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      category: form.category,
      locale: form.locale,
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || form.title.trim(),
      content: form.content.trim(),
      authorName: form.authorName.trim() || 'MyCashBill',
      tags,
      published: form.published,
      status: form.published ? 'PUBLISHED' : 'DRAFT',
    };

    try {
      if (creating) {
        const res = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Erreur création');
        }
        toast.show('Nouveau contenu créé avec succès', 'success');
      } else if (editing) {
        const res = await fetch(`/api/admin/articles/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Erreur mise à jour');
        }
        toast.show('Contenu mis à jour avec succès', 'success');
      }
      closeEditor();
      setRefresh((n) => n + 1);
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Erreur enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const matchCat =
        filterCategory === 'all' ||
        item.category?.toUpperCase() === filterCategory.toUpperCase();
      const matchLoc =
        filterLocale === 'all' ||
        item.locale?.toUpperCase() === filterLocale.toUpperCase();
      const matchPub =
        filterPublished === 'all' ||
        (filterPublished === 'published' ? item.published : !item.published);
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchLoc && matchPub && matchSearch;
    });
  }, [items, filterCategory, filterLocale, filterPublished, search]);

  const previewHtml = useMemo(() => {
    if (!form.content) return '';
    try {
      const raw = marked.parse(form.content) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return '';
    }
  }, [form.content]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Gestion du Contenu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Interface unifiée pour les articles de Blog et les questions de FAQ.
          </p>
        </div>
        {!creating && !editing && (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            + Nouveau contenu
          </Button>
        )}
      </div>

      {/* Editor Drawer / Form */}
      {(creating || editing) && (
        <Card className="border-sage-300 p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-ink">
              {creating ? 'Créer un nouveau contenu' : `Modifier "${editing?.title}"`}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeEditor}>
              ✕ Fermer
            </Button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as 'BLOG' | 'FAQ' })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="BLOG">Blog</option>
                  <option value="FAQ">FAQ</option>
                </select>
              </div>

              {/* Locale */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Langue
                </label>
                <select
                  value={form.locale}
                  onChange={(e) =>
                    setForm({ ...form, locale: e.target.value as 'FR' | 'EN' })
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="FR">Français (FR)</option>
                  <option value="EN">English (EN)</option>
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Auteur
                </label>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="MyCashBill"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder={
                  form.category === 'FAQ'
                    ? 'Ex: Comment payer par Mobile Money ?'
                    : 'Ex: Guide complet de la TVA à 19,25%'
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Slug */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Slug URL (optionnel)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                  placeholder="auto-généré si vide"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={form.tagsString}
                  onChange={(e) => setForm({ ...form, tagsString: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="facturation, mobile-money, fiscalité"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Extrait / Résumé
              </label>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Court aperçu ou chapô pour le référencement..."
              />
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                id="togglePublish"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="h-4 w-4 rounded text-sage-600 focus:ring-sage-500"
              />
              <label htmlFor="togglePublish" className="text-sm font-medium text-ink cursor-pointer">
                Publié en ligne (visible publiquement)
              </label>
            </div>

            {/* Content Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Corps du contenu (Markdown)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('edit')}
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      previewTab === 'edit'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Édition
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      previewTab === 'preview'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Aperçu
                  </button>
                </div>
              </div>

              {previewTab === 'edit' ? (
                <textarea
                  rows={12}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-3 font-mono text-sm leading-relaxed"
                  placeholder="Rédigez en Markdown..."
                />
              ) : (
                <div
                  className="min-h-[280px] rounded-md border border-slate-200 bg-slate-50 p-4 prose prose-slate max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-slate-400">Aucun contenu à prévisualiser</p>' }}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeEditor}>
                Annuler
              </Button>
              <Button type="submit" isLoading={saving}>
                {creating ? 'Créer le contenu' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            type="search"
            placeholder="Rechercher par titre ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-1"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Toutes catégories</option>
            <option value="BLOG">Blog uniquement</option>
            <option value="FAQ">FAQ uniquement</option>
          </select>

          <select
            value={filterLocale}
            onChange={(e) => setFilterLocale(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Toutes langues</option>
            <option value="FR">Français (FR)</option>
            <option value="EN">English (EN)</option>
          </select>

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
      </Card>

      {/* Items List */}
      {!items ? (
        <SkeletonList rows={5} />
      ) : filteredItems.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <p className="text-base font-semibold">Aucun contenu trouvé</p>
          <p className="mt-1 text-xs">Modifiez vos filtres ou créez une nouvelle entrée.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col gap-4 p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Pill */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      item.category === 'FAQ'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {item.category}
                  </span>

                  {/* Locale Pill */}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-600">
                    {item.locale}
                  </span>

                  {/* Published Status */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.published
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.published ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    />
                    {item.published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-ink sm:text-base">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono truncate max-w-xl">
                  /{item.locale.toLowerCase()}/{item.category.toLowerCase()}/{item.slug}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleTogglePublish(item)}
                >
                  {item.published ? 'Dépublier' : 'Publier'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  Éditer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(item)}
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
