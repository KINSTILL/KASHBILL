const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'messages', 'fr.json');
const enPath = path.join(__dirname, '..', 'messages', 'en.json');

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Update recurring
fr.recurring = {
  ...fr.recurring,
  schedule: 'Programmer',
  list: 'Plannings récurrents',
  frequency: "Fréquence d'exécution",
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  autoEmail: 'Envoi automatique par email',
  autoEmailHelp: 'Envoyer par email automatiquement (si le client a un email)',
  pause: 'Mettre en pause',
  resume: 'Reprendre',
  delete: 'Supprimer',
  empty: 'Aucun planning récurrent',
  nextRun: 'Prochaine exécution',
  lastRun: 'Dernière exécution',
  emailNotAvailable: 'Email non disponible pour ce client',
};

en.recurring = {
  ...en.recurring,
  schedule: 'Schedule',
  list: 'Recurring schedules',
  frequency: 'Execution frequency',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  autoEmail: 'Automatic email delivery',
  autoEmailHelp: 'Send by email automatically (if client has an email)',
  pause: 'Pause',
  resume: 'Resume',
  delete: 'Delete',
  empty: 'No recurring schedules',
  nextRun: 'Next execution',
  lastRun: 'Last execution',
  emailNotAvailable: 'Email not available for this client',
};

// Update bulk
fr.bulk = {
  ...fr.bulk,
  send: 'Envoyer en masse',
  title: 'Envoi en masse',
  selectClients: 'Sélectionner les clients ({count} sélectionné(s))',
  channel: "Canal d'envoi",
  channelEmail: 'Email (envoi direct depuis le serveur)',
  channelWhatsappLinks: 'WhatsApp (liens wa.me à cliquer)',
  channelWhatsappHelp: 'Génère des liens wa.me à cliquer manuellement (pas d’API WhatsApp)',
  sendButton: "Lancer l'envoi en masse",
  results: 'Résultats',
  success: 'Envoi en masse terminé avec succès',
  partial: 'Envoi partiellement réussi',
  openWhatsapp: 'Ouvrir WhatsApp',
  noPhone: 'Pas de téléphone',
};

en.bulk = {
  ...en.bulk,
  send: 'Send in bulk',
  title: 'Bulk sending',
  selectClients: 'Select clients ({count} selected)',
  channel: 'Sending channel',
  channelEmail: 'Email (direct send from server)',
  channelWhatsappLinks: 'WhatsApp (wa.me links to click)',
  channelWhatsappHelp: 'Generates wa.me links to click manually (no WhatsApp API)',
  sendButton: 'Start bulk send',
  results: 'Results',
  success: 'Bulk sending completed successfully',
  partial: 'Partially successful sending',
  openWhatsapp: 'Open WhatsApp',
  noPhone: 'No phone',
};

function compareKeys(a, b, prefix = '') {
  const missing = [];
  for (const k in a) {
    const full = prefix ? prefix + '.' + k : k;
    if (!(k in b)) {
      missing.push(full);
    } else if (typeof a[k] === 'object' && a[k] !== null && typeof b[k] === 'object' && b[k] !== null) {
      missing.push(...compareKeys(a[k], b[k], full));
    }
  }
  return missing;
}

const diff1 = compareKeys(fr, en);
const diff2 = compareKeys(en, fr);

if (diff1.length > 0 || diff2.length > 0) {
  console.error('MISMATCH:', { diff1, diff2 });
  process.exit(1);
}

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
console.log('SUCCESS: All keys updated with 0 discrepancies.');
