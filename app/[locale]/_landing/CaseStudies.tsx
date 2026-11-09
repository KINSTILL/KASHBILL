'use client';

export function CaseStudies({ locale = 'fr' }: { locale?: string }) {
  const isFr = locale === 'fr';

  const cases = [
    {
      name: 'Amina T.',
      role: isFr ? 'Styliste & Créatrice de mode' : 'Fashion Designer & Tailor',
      location: isFr ? 'Atelier Amina Couture · Douala, Cameroun' : 'Amina Studio · Douala, Cameroon',
      avatar: '👗',
      avatarBg: 'bg-rose-100 text-rose-800',
      before: isFr
        ? '« Avant, j’envoyais mes tarifs dans un simple message WhatsApp. Les clientes négociaient sans cesse et mettaient des semaines à verser l’acompte. »'
        : '“Before, I sent prices as plain WhatsApp messages. Clients constantly bargained and took weeks to pay deposits.”',
      after: isFr
        ? '« Depuis que j’envoie un Devis Pro avec mon logo officiel et le cachet d’atelier, l’acompte de 50% est versé sous 24h. Le document fait tellement sérieux que personne ne discute mes tarifs. »'
        : '“Since I send an official Quote with my logo and workshop stamp, 50% deposits are paid within 24h. It looks so professional that nobody questions my prices.”',
      metric: isFr ? 'Acomptes versés sous 24h' : 'Deposits paid within 24h',
      metricIcon: '⚡',
    },
    {
      name: 'Ibrahim K.',
      role: isFr ? 'E-commerçant & Accessoires' : 'E-commerce & Retail Merchant',
      location: isFr ? 'Boutique K-Style · Abidjan, Côte d’Ivoire' : 'K-Style Store · Abidjan, Côte d’Ivoire',
      avatar: '📦',
      avatarBg: 'bg-amber-100 text-amber-800',
      before: isFr
        ? '« Les litiges à la livraison étaient un enfer. Le client disait au coursier moto : "Je n’avais pas commandé ça" ou "Ce n’était pas le montant convenu". Le livreur repartait et je perdais la course. »'
        : '“Delivery disputes were a nightmare. Clients told motorbike couriers: “I did not order this” or “that wasn’t the agreed price”. The courier returned and I lost shipping fees.”',
      after: isFr
        ? '« Chaque colis part avec son Bon de Livraison généré en 30 secondes. Le client émarge à la réception. En 3 mois, j’ai éliminé 100% des contestations de livraison. »'
        : '“Every parcel now ships with a clean Delivery Note generated in 30 sec. Clients sign upon receipt. In 3 months, delivery disputes dropped to zero.”',
      metric: isFr ? '0 litige de livraison' : 'Zero delivery disputes',
      metricIcon: '🛡️',
    },
    {
      name: 'Christian M.',
      role: isFr ? 'Développeur & Consultant Tech' : 'Software Developer & Tech Consultant',
      location: isFr ? 'Kemet Solutions · Yaoundé / Dakar' : 'Kemet Solutions · Yaoundé / Dakar',
      avatar: '💻',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      before: isFr
        ? '« Je perdais des contrats avec des entreprises parce qu’elles exigeaient une facture formelle avec NIU, RCCM et ventilation HT. Je passais 45 minutes à batailler sur un modèle Word cassé. »'
        : '“I was losing corporate deals because enterprise clients required formal invoices with tax ID and clean VAT breakdown. I wasted 45 minutes on broken Word templates.”',
      after: isFr
        ? '« En 47 secondes sur mon smartphone, ma facture A4 est prête avec mon QR Code de vérification. Mon client la transmet directement à sa comptabilité qui débloque le virement sans blocage. »'
        : '“In 47 seconds on my phone, my A4 invoice is ready with a verification QR code. Corporate clients forward it directly to accounting and payment clears without friction.”',
      metric: isFr ? 'Facture prête en 47 sec' : 'Invoice ready in 47 sec',
      metricIcon: '🚀',
    },
  ];

  return (
    <section className="bg-white py-16 px-4 border-t border-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800">
            👥 {isFr ? 'Cas d’usage concrets' : 'Real Business Stories'}
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {isFr
              ? 'Ils ont arrêté de galérer avec leurs factures.'
              : 'They stopped struggling with invoices.'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base max-w-2xl mx-auto">
            {isFr
              ? 'Voyez comment des créateurs, commerçants et indépendants en Afrique se font payer plus vite grâce à des documents impeccables.'
              : 'See how African artisans, merchants, and freelancers get paid faster with spotless documents.'}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cases.map((c, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-sage-400"
            >
              <div className="space-y-4">
                {/* En-tête profil */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-xs ${c.avatarBg}`}>
                    {c.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{c.name}</p>
                    <p className="text-xs font-medium text-slate-600 truncate">{c.role}</p>
                    <p className="text-[11px] text-slate-400 truncate">{c.location}</p>
                  </div>
                </div>

                {/* Situation Avant */}
                <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3 text-xs text-rose-900 leading-relaxed">
                  <span className="font-bold text-rose-800 block mb-1">
                    {isFr ? '❌ La galère avant :' : '❌ Struggle before:'}
                  </span>
                  {c.before}
                </div>

                {/* Résultat Après */}
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-emerald-950 leading-relaxed">
                  <span className="font-bold text-emerald-800 block mb-1">
                    {isFr ? '✓ Avec MyCashBill :' : '✓ With MyCashBill:'}
                  </span>
                  {c.after}
                </div>
              </div>

              {/* Métrique résultat */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isFr ? 'Bénéfice constaté :' : 'Key outcome:'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-bold text-sage-900">
                  <span>{c.metricIcon}</span>
                  <span>{c.metric}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}