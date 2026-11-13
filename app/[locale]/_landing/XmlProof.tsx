import { FileText, FileCode2, Plus, Calculator, Landmark, Archive } from 'lucide-react';

const XML_SAMPLE = `<Invoice>
  <cbc:ID>FA-2026-0042</cbc:ID>
  <cbc:IssueDate>2026-11-10</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>XAF</cbc:DocumentCurrencyCode>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount>77500</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

export function XmlProof({ locale = 'fr' }: { locale?: string }) {
  const isFr = locale === 'fr';
  const bullets = [
    {
      icon: Calculator,
      title: isFr ? 'Comptabilité' : 'Accounting',
      desc: isFr ? 'Importable dans vos logiciels, sans ressaisie' : 'Importable into your software, no re-typing',
    },
    {
      icon: Landmark,
      title: isFr ? 'Banque & administration' : 'Bank & authorities',
      desc: isFr ? 'Des données propres et lisibles par machine' : 'Clean, machine-readable data',
    },
    {
      icon: Archive,
      title: isFr ? 'Archivage' : 'Archiving',
      desc: isFr ? 'Un format ouvert, durable et sans dépendance' : 'An open, durable, vendor-free format',
    },
  ];

  return (
    <section id="xml" className="border-b border-slate-200/70 bg-white px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
            <FileCode2 className="h-3.5 w-3.5" />
            PDF + XML
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-3xl">
            {isFr ? 'Chaque document = un PDF + un fichier XML' : 'Every document = a PDF + an XML file'}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            {isFr
              ? 'Votre client reçoit un PDF soigné. Vos logiciels reçoivent un XML structuré (format UBL) qu’ils savent lire.'
              : 'Your client gets a polished PDF. Your software gets a structured XML file (UBL format) it can read.'}
          </p>
        </div>

        <div className="mt-8 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
              <FileText className="h-4 w-4 text-emerald-600" />
              {isFr ? 'Pour vos clients : le PDF' : 'For your clients: the PDF'}
            </div>
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Kmer Chic Boutique</span>
                <span>FA-2026-0042</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between"><span>Robe Soie &amp; Wax</span><span className="font-mono">45 000</span></div>
              <div className="flex justify-between"><span>Sac cuir</span><span className="font-mono">30 000</span></div>
              <div className="flex justify-between rounded-md bg-emerald-600 px-2 py-1 font-bold text-white">
                <span>Total</span><span className="font-mono">77 500 FCFA</span>
              </div>
            </div>
          </div>

          <div className="hidden justify-self-center md:block" aria-hidden="true">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-4 ring-emerald-500/10">
              <Plus className="h-4 w-4" />
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-slate-950 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-100">
              <FileCode2 className="h-4 w-4 text-emerald-400" />
              {isFr ? 'Pour vos logiciels : le XML' : 'For your software: the XML'}
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[10.5px] leading-relaxed text-emerald-200">
              <code>{XML_SAMPLE}</code>
            </pre>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {bullets.map((b) => (
            <li key={b.title} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <b.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{b.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
