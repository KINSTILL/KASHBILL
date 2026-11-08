'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

type Doc = {
  id: string; slug: string; version: string; locale: 'FR' | 'EN';
  title: string; content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  effectiveAt: string | null;
};

export default function AdminLegalPage() {
  const toast = useToast();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ slug: 'cgu', version: '1.0', locale: 'FR' as 'FR' | 'EN', title: '', content: '' });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetch('/api/admin/legal').then((r) => r.json()).then((d) => setDocs(d.documents ?? []));
  }, [refresh]);

  const save = async () => {
    try {
      const url = editing ? `/api/admin/legal/${editing.id}` : '/api/admin/legal';
      const method = editing ? 'PATCH' : 'POST';
      const body = editing
        ? { title: form.title, content: form.content }
        : { slug: form.slug, version: form.version, locale: form.locale, title: form.title, content: form.content };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { toast.show('Erreur', 'error'); return; }
      toast.show(editing ? 'Modifié' : 'Créé', 'success');
      setEditing(null); setCreating(false);
      setRefresh((r) => r + 1);
    } catch { toast.show('Erreur réseau', 'error'); }
  };

  const publish = async (id: string) => {
    await fetch(`/api/admin/legal/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
    toast.show('Publié', 'success');
    setRefresh((r) => r + 1);
  };

  const archive = async (id: string) => {
    await fetch(`/api/admin/legal/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      body: JSON.stringify({ status: 'ARCHIVED' }),
    });
    toast.show('Archivé', 'success');
    setRefresh((r) => r + 1);
  };

  if (docs === null) return <SkeletonList rows={5} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pages légales</h1>
        <Button onClick={() => { setCreating(true); setEditing(null); setForm({ slug: 'cgu', version: '1.0', locale: 'FR', title: '', content: '' }); }}>+ Nouvelle version</Button>
      </div>

      {(creating || editing) && (
        <Card>
          <div className="space-y-2">
            {!editing && (
              <div className="grid grid-cols-3 gap-2">
                <select value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded border px-2 py-1 text-sm">
                  {['cgu','cgv','privacy','cookies','mentions-legales','disclaimer','refund'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="Version" className="rounded border px-2 py-1 text-sm" />
                <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as 'FR' | 'EN' })} className="rounded border px-2 py-1 text-sm">
                  <option>FR</option><option>EN</option>
                </select>
              </div>
            )}
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre" className="w-full rounded border px-2 py-1 text-sm" />
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Contenu (Markdown)" rows={20} className="w-full rounded border px-2 py-1 font-mono text-xs" />
            <div className="flex gap-2">
              <Button onClick={save}>Enregistrer</Button>
              <Button variant="ghost" onClick={() => { setEditing(null); setCreating(false); }}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {docs.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{d.slug} · v{d.version} · {d.locale}</p>
                <p className="truncate text-xs text-slate-500">{d.title}</p>
                <p className="text-xs text-slate-400">{d.status}{d.effectiveAt && ` · ${new Date(d.effectiveAt).toLocaleDateString('fr-FR')}`}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(d); setCreating(false); setForm({ slug: d.slug, version: d.version, locale: d.locale, title: d.title, content: d.content }); }}>Éditer</Button>
                {d.status === 'DRAFT' && <Button size="sm" onClick={() => publish(d.id)}>Publier</Button>}
                {d.status === 'PUBLISHED' && <Button size="sm" variant="ghost" onClick={() => archive(d.id)}>Archiver</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

