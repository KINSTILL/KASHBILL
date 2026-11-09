/* eslint-disable no-console */
import { PrismaClient, Role, Locale, ArticleStatus } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomInt } from 'node:crypto';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Générateur de referralCode
// ─────────────────────────────────────────────
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error('Impossible de générer un referralCode unique après 10 tentatives');
}

// ─────────────────────────────────────────────
// Seed admin
// ─────────────────────────────────────────────
async function seedAdmin() {
  const adminPhonesRaw = process.env.ADMIN_PHONES || process.env.ADMIN_PHONE;
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPhonesRaw || !adminPin) {
    throw new Error('ADMIN_PHONE et ADMIN_PIN doivent être définis dans .env.local');
  }

  const adminPhones = adminPhonesRaw
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('+') ? p : `+237${p}`));

  const pinHash = await hash(adminPin, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    algorithm: 2,
  });

  for (const phone of adminPhones) {
    const existing = await prisma.user.findUnique({ where: { phone } });

  if (existing) {
    await prisma.user.update({
      where: { phone },
      data: { pinHash, role: Role.ADMIN },
    });
    console.log(`✅ Admin mis à jour : ${phone}`);
  } else {
    const referralCode = await generateUniqueReferralCode();
    await prisma.user.create({
      data: {
        phone,
        pinHash,
        role: Role.ADMIN,
        name: 'Admin',
        referralCode,
      },
    });
      console.log(`✅ Admin créé : ${phone} (referralCode: ${referralCode})`);
    }
  }
}

// ─────────────────────────────────────────────
// Seed pays
// ─────────────────────────────────────────────
// Internal note: mobile money coverage active in 7 countries.
// Keep provider-agnostic naming in code and UI.
const MOBILE_MONEY_ENABLED = new Set(['CM', 'CI', 'SN', 'GA', 'GH', 'KE', 'UG']);

const COUNTRIES = [
  { countryCode: 'CM', countryNameFr: 'Cameroun', countryNameEn: 'Cameroon', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 19.25, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'CI', countryNameFr: "Côte d'Ivoire", countryNameEn: 'Ivory Coast', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'SN', countryNameFr: 'Sénégal', countryNameEn: 'Senegal', currency: 'XOF', taxIdLabel: 'NINEA', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'GA', countryNameFr: 'Gabon', countryNameEn: 'Gabon', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm'] },
  { countryCode: 'GH', countryNameFr: 'Ghana', countryNameEn: 'Ghana', currency: 'GHS', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'] },
  { countryCode: 'KE', countryNameFr: 'Kenya', countryNameEn: 'Kenya', currency: 'KES', taxIdLabel: 'KRA PIN', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'UG', countryNameFr: 'Ouganda', countryNameEn: 'Uganda', currency: 'UGX', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'] },
  // Autres pays (app utilisable, pas de mobile money sur documents)
  { countryCode: 'BJ', countryNameFr: 'Bénin', countryNameEn: 'Benin', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'BF', countryNameFr: 'Burkina Faso', countryNameEn: 'Burkina Faso', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'TG', countryNameFr: 'Togo', countryNameEn: 'Togo', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'ML', countryNameFr: 'Mali', countryNameEn: 'Mali', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'NE', countryNameFr: 'Niger', countryNameEn: 'Niger', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 19.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'NG', countryNameFr: 'Nigéria', countryNameEn: 'Nigeria', currency: 'NGN', taxIdLabel: 'TIN', rccmLabel: 'RC No.', vatRate: 7.50, requiredFields: ['taxId'] },
  { countryCode: 'SL', countryNameFr: 'Sierra Leone', countryNameEn: 'Sierra Leone', currency: 'SLE', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'] },
  { countryCode: 'CG', countryNameFr: 'Congo', countryNameEn: 'Congo', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm'] },
  { countryCode: 'CD', countryNameFr: 'RDC', countryNameEn: 'DRC', currency: 'CDF', taxIdLabel: 'ID Nat.', rccmLabel: 'RCCM', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'TZ', countryNameFr: 'Tanzanie', countryNameEn: 'Tanzania', currency: 'TZS', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'] },
  { countryCode: 'RW', countryNameFr: 'Rwanda', countryNameEn: 'Rwanda', currency: 'RWF', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'] },
  { countryCode: 'ZM', countryNameFr: 'Zambie', countryNameEn: 'Zambia', currency: 'ZMW', taxIdLabel: 'TPIN', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'MW', countryNameFr: 'Malawi', countryNameEn: 'Malawi', currency: 'MWK', taxIdLabel: 'TPIN', rccmLabel: 'Reg. No.', vatRate: 16.50, requiredFields: ['taxId'] },
  { countryCode: 'MZ', countryNameFr: 'Mozambique', countryNameEn: 'Mozambique', currency: 'MZN', taxIdLabel: 'NUIT', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'LS', countryNameFr: 'Lesotho', countryNameEn: 'Lesotho', currency: 'LSL', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'] },
];

async function seedCountries() {
  for (const country of COUNTRIES) {
    await prisma.countryTaxConfig.upsert({
      where: { countryCode: country.countryCode },
      update: {
        ...country,
        vatRate: country.vatRate,
        requiredFields: country.requiredFields,
        legalMentionsTemplate: (country as { legalMentionsTemplate?: string }).legalMentionsTemplate ?? '',
        mobileMoneyEnabled: MOBILE_MONEY_ENABLED.has(country.countryCode),
      },
      create: {
        ...country,
        vatRate: country.vatRate,
        requiredFields: country.requiredFields,
        legalMentionsTemplate: (country as { legalMentionsTemplate?: string }).legalMentionsTemplate ?? '',
        mobileMoneyEnabled: MOBILE_MONEY_ENABLED.has(country.countryCode),
      },
    });
  }
  console.log(`✅ ${COUNTRIES.length} pays seedés`);
}

// ─────────────────────────────────────────────
// Seed seuils de fraude
// ─────────────────────────────────────────────
const THRESHOLDS = [
  { key: 'MAX_DOCS_PER_24H',                value: 300,      floor: 10,      ceiling: 3000,      description: 'Nombre max de documents par utilisateur / 24h' },
  { key: 'MAX_AMOUNT_FCFA',                 value: 5000000,  floor: 500000,  ceiling: 100000000, description: 'Montant max d\'un document sans flag' },
  { key: 'HIGH_AMOUNT_THRESHOLD_FCFA',      value: 2000000,  floor: 200000,  ceiling: 20000000,  description: 'Seuil "montant élevé" pour compte récent' },
  { key: 'NEW_ACCOUNT_DAYS',                value: 7,        floor: 0,       ceiling: 30,        description: 'Ancienneté minimale pour générer gros montant' },
  { key: 'FRAUD_FIELDS_THRESHOLD_FCFA',     value: 1000000,  floor: 200000,  ceiling: 20000000,  description: 'Seuil au-delà duquel les champs fiscaux sont recommandés' },
  { key: 'MAX_DOCS_PER_CLIENT_24H',         value: 50,       floor: 10,      ceiling: 200,       description: 'Nombre max de documents pour un même client / 24h' },
];

async function seedThresholds() {
  for (const t of THRESHOLDS) {
    await prisma.fraudThreshold.upsert({
      where: { key: t.key },
      update: { floor: t.floor, ceiling: t.ceiling, description: t.description },
      create: t,
    });
  }
  console.log(`✅ ${THRESHOLDS.length} seuils de fraude seedés`);
}

// ─────────────────────────────────────────────
// Seed Documents Légaux
// ─────────────────────────────────────────────
async function seedLegal() {
  const legalPages = [
    {
      slug: 'cgu',
      title: "Conditions Générales d'Utilisation",
      content: `# Conditions Générales d'Utilisation

**Version 1.0 — En vigueur à compter du ${new Date().toLocaleDateString('fr-FR')}**

## 1. Objet

Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'utilisation de la plateforme MyCashBill (« la Plateforme »), service de génération de documents commerciaux (devis, factures, reçus, bons de commande, bordereaux de livraison) édité par MyCashBill SARL.

## 2. Nature du service — OUTIL TECHNIQUE

**MyCashBill est un OUTIL TECHNIQUE de génération de documents.** La Plateforme :

- **Ne fournit AUCUN conseil juridique, fiscal, comptable ou financier.**
- **N'EST PAS un logiciel de comptabilité.**
- **N'EST PAS un service d'archivage électronique à valeur probante (SAE).**
- **N'EST PAS un cabinet d'expertise comptable.**
- **N'EST PAS un certificateur de conformité fiscale.**

L'Utilisateur est **seul responsable** de :
- L'exactitude des informations saisies
- La conformité fiscale des documents émis (mentions obligatoires, NIU, RCCM, TVA, numérotation)
- La conservation légale de ses documents (10 ans selon la réglementation applicable)
- L'usage fait des documents

## 3. Accès au service

L'accès nécessite la création d'un compte via numéro de téléphone et code PIN. L'Utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de son PIN.

## 4. Offres et tarifs

- **Offre gratuite** : fonctionnalités limitées (10 documents/mois, 5 envois WhatsApp/mois, 1 email/mois, 2 clients, filigrane visible, 1 appareil)
- **Offre Pro** : 2 000 FCFA / 30 jours, fonctionnalités complètes, 2 appareils
- Les tarifs peuvent être modifiés avec préavis de 30 jours.

## 5. Conservation et suppression des données

MyCashBill conserve temporairement les documents générés pour faciliter le téléchargement par l'Utilisateur. **Cette conservation NE CONSTITUE PAS un archivage légal.** L'Utilisateur est responsable du téléchargement et de la conservation de ses documents. Les documents peuvent être supprimés après la période de rétention de l'offre souscrite.

## 6. Responsabilité

**La responsabilité de MyCashBill est strictement limitée au plus faible des deux montants suivants : (a) le montant total payé par l'Utilisateur au cours des 3 derniers mois ; (b) 10 000 FCFA.**

MyCashBill **exclut expressément toute responsabilité** pour :
- Les dommages indirects (perte de chiffre d'affaires, perte de clientèle, perte de chance)
- Les erreurs de saisie de l'Utilisateur
- La non-conformité fiscale des documents
- La perte de documents non téléchargés
- Les litiges commerciaux entre l'Utilisateur et ses clients
- L'indisponibilité temporaire du service

## 7. Propriété intellectuelle

Le code source, les marques, les logos et l'interface de MyCashBill sont la propriété exclusive de MyCashBill SARL. Les documents générés par l'Utilisateur lui appartiennent. MyCashBill ne revendique aucun droit sur le contenu saisi par l'Utilisateur.

## 8. Données personnelles

Le traitement des données est régi par la Politique de Confidentialité accessible à l'adresse /legal/privacy, conforme à la loi camerounaise n°2024/017 sur la protection des données personnelles.

## 9. Suspension et résiliation

MyCashBill peut suspendre ou résilier un compte en cas de :
- Violation des présentes CGU
- Usage frauduleux
- Non-paiement
- Activité illégale

L'Utilisateur peut supprimer son compte à tout moment depuis les paramètres. Les documents sont conservés selon la politique de rétention.

## 10. Modification des CGU

MyCashBill peut modifier les CGU. Les modifications majeures font l'objet d'une notification. La poursuite de l'utilisation vaut acceptation.

## 11. Droit applicable et juridiction

Les présentes CGU sont régies par le droit camerounais. Tout litige sera soumis aux tribunaux compétents de Douala, Cameroun.

## 12. Contact

Pour toute question : support@mycashbill.app

---

*Document de démonstration — à réviser par un avocat camerounais avant mise en production.*`,
    },
    {
      slug: 'cgv',
      title: 'Conditions Générales de Vente',
      content: `# Conditions Générales de Vente

**Version 1.0 — En vigueur à compter du ${new Date().toLocaleDateString('fr-FR')}**

## 1. Objet

Les présentes CGV régissent la souscription à l'offre Pro de MyCashBill et les modalités de paiement.

## 2. Prix

- **Offre Pro** : 2 000 FCFA / 30 jours
- **Add-on Appareil supplémentaire** : +500 FCFA / mois
- **Add-on White-label** : +3 000 FCFA / mois

Les prix sont exprimés en francs CFA, toutes taxes comprises.

## 3. Paiement

Le paiement s'effectue via Notch Pay :
- Mobile Money dans 7 pays (Cameroun, Côte d'Ivoire, Sénégal, Gabon, Ghana, Kenya, Ouganda)
- Carte bancaire (Visa, Mastercard) dans tous les autres pays

## 4. Durée et renouvellement

L'abonnement Pro est souscrit pour 30 jours. **Il n'y a PAS de renouvellement automatique.** L'Utilisateur doit renouveler manuellement chaque mois pour continuer à bénéficier de l'offre Pro.

## 5. Facturation

Une facture d'abonnement est émise automatiquement après chaque paiement réussi. Elle est téléchargeable depuis /subscriptions et envoyée par email si configurée.

## 6. Remboursement

**Aucun remboursement n'est accordé après le début de la période souscrite**, sauf en cas :
- D'erreur technique de facturation
- De double paiement
- De défaillance prolongée du service (plus de 7 jours consécutifs)

Les demandes doivent être adressées à support@mycashbill.app dans les 7 jours suivant le paiement.

## 7. Rétractation

Conformément à la réglementation, l'Utilisateur professionnel ne bénéficie pas du droit de rétractation pour les services numériques exécutés immédiatement.

## 8. Résiliation

L'Utilisateur peut arrêter son abonnement à tout moment. Aucun prélèvement futur ne sera effectué (pas de reconduction automatique).

## 9. Droit applicable

Droit camerounais. Juridiction : tribunaux de Douala.

---

*Document de démonstration — à réviser par un avocat.*`,
    },
    {
      slug: 'privacy',
      title: 'Politique de Confidentialité',
      content: `# Politique de Confidentialité

**Version 1.0 — En vigueur à compter du ${new Date().toLocaleDateString('fr-FR')}**

Conformément à la **loi camerounaise n°2024/017 du 23 décembre 2024** relative à la protection des données à caractère personnel.

## 1. Responsable du traitement

MyCashBill SARL, [adresse à compléter], Douala, Cameroun. Contact : support@mycashbill.app

## 2. Données collectées

**Données d'identification** : numéro de téléphone, nom, nom de l'entreprise, ville, identifiants fiscaux (NIU, RCCM), adresse légale, logo, signature.

**Données de facturation** : documents générés, informations clients, montants.

**Données techniques** : adresse IP, user-agent, device_id, journaux d'activité (audit log).

**Données de paiement** : les informations de carte bancaire ne sont **JAMAIS stockées** sur nos serveurs. Elles sont traitées directement par notre prestataire de paiement Notch Pay (PCI-DSS compliant).

## 3. Finalités du traitement

- Fourniture du service de génération de documents
- Gestion des comptes utilisateurs
- Traitement des paiements
- Prévention de la fraude
- Support client
- Amélioration du service (analytics anonymisées)

## 4. Base légale

- Exécution du contrat
- Consentement (cookies non essentiels, communications marketing)
- Obligation légale (conservation des factures d'abonnement)
- Intérêt légitime (prévention de la fraude)

## 5. Durée de conservation

- **Données de compte** : tant que le compte est actif, puis suppression ou anonymisation
- **Documents générés** : selon la période de rétention de l'offre (30j gratuit, 365j Pro)
- **Factures d'abonnement** : 10 ans (obligation comptable)
- **Journaux d'audit** : 12 mois
- **Cookies** : 12 mois maximum

## 6. Destinataires

- **Notch Pay** (paiements)
- **Resend** (envoi d'emails transactionnels)
- **Hébergeur** (VPS Contabo — Allemagne)
- **Autorités** sur réquisition légale

## 7. Transferts internationaux

Certains prestataires sont situés hors du Cameroun (Allemagne pour l'hébergement, États-Unis pour Resend). Les transferts respectent les garanties appropriées (clauses contractuelles types).

## 8. Droits de l'Utilisateur

Conformément à la loi n°2024/017, l'Utilisateur dispose des droits suivants :
- **Accès** à ses données
- **Rectification** des données inexactes
- **Effacement** (droit à l'oubli)
- **Limitation** du traitement
- **Opposition** au traitement
- **Portabilité** des données

Pour exercer ces droits : support@mycashbill.app. Réponse sous 30 jours.

## 9. Sécurité

- Chiffrement HTTPS obligatoire
- Mots de passe hachés (argon2id)
- Accès restreint aux données
- Audit log de toutes les actions sensibles

## 10. Cookies

Voir la Politique de Cookies accessible à /legal/cookies.

## 11. Autorité de contrôle

L'Utilisateur peut saisir l'autorité camerounaise de protection des données en cas de litige.

## 12. Modifications

Toute modification substantielle fera l'objet d'une notification et d'une re-acceptation.

---

*Document de démonstration — à réviser par un avocat.*`,
    },
    {
      slug: 'cookies',
      title: 'Politique de Cookies',
      content: `# Politique de Cookies

**Version 1.0 — En vigueur à compter du ${new Date().toLocaleDateString('fr-FR')}**

## 1. Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web.

## 2. Cookies utilisés par MyCashBill

### Cookies essentiels (toujours actifs)

| Nom | Finalité | Durée |
|-----|----------|-------|
| \`mycashbill_session\` | Maintien de la session utilisateur | 7 jours |
| \`NEXT_LOCALE\` | Préférence de langue | 1 an |
| \`mycashbill_consent\` | Choix cookies | 1 an |

Ces cookies sont indispensables au fonctionnement du service et ne peuvent pas être désactivés.

### Cookies analytiques (opt-in)

Utilisés pour mesurer l'audience et améliorer le service. Chargés UNIQUEMENT si vous cliquez sur « Tout accepter ».

## 3. Gestion des cookies

Vous pouvez modifier votre choix à tout moment depuis les paramètres de votre navigateur ou en cliquant sur « Gérer les cookies » en pied de page.

## 4. Contact

Pour toute question : support@mycashbill.app

---

*Document de démonstration.*`,
    },
    {
      slug: 'mentions-legales',
      title: 'Mentions Légales',
      content: `# Mentions Légales

## Éditeur du site

**MyCashBill SARL** (à compléter)
- Forme juridique : SARL
- Capital social : [à compléter]
- Siège social : [adresse complète], Douala, Cameroun
- NIU : [à compléter]
- RCCM : [à compléter]
- Téléphone : +237 6XX XXX XXX
- Email : support@mycashbill.app

## Directeur de publication

[À compléter]

## Hébergeur

**Contabo GmbH**
- Adresse : Aschauer Straße 32a, 81549 München, Allemagne
- Site : contabo.com

## Propriété intellectuelle

L'ensemble du contenu de MyCashBill (code source, marques, logos, interface) est la propriété exclusive de MyCashBill SARL. Toute reproduction non autorisée est interdite.

## Contact

support@mycashbill.app

---

*Document de démonstration — à compléter avant production.*`,
    },
    {
      slug: 'disclaimer',
      title: 'Clause de Non-Responsabilité',
      content: `# Clause de Non-Responsabilité

## Nature du service

MyCashBill est un **outil technique de génération de documents**. Il ne fournit AUCUN conseil juridique, fiscal, comptable ou financier. Il n'est PAS un logiciel de comptabilité, un service d'archivage électronique (SAE), un certificateur de conformité fiscale, ni un cabinet d'expertise comptable.

## Responsabilité de l'Utilisateur

L'Utilisateur est **seul responsable** de :

- L'exactitude des informations saisies dans les documents
- La conformité fiscale des documents émis (mentions obligatoires, NIU, RCCM, TVA, numérotation séquentielle)
- La conservation légale de ses documents (10 ans selon la réglementation)
- L'usage fait des documents
- La vérification des taux de change affichés (les taux fluctuent)
- L'obtention des autorisations nécessaires auprès des autorités fiscales

## Limitation de responsabilité

**La responsabilité de MyCashBill est strictement limitée au plus faible des deux montants suivants : (a) le montant total payé par l'Utilisateur au cours des 3 derniers mois ; (b) 10 000 FCFA.**

Pour l'offre gratuite, ce plafond est de **0 FCFA**.

## Exclusions expresses

MyCashBill exclut toute responsabilité pour :

- Les dommages indirects (perte de chiffre d'affaires, perte de clientèle, perte de chance, perte de données, atteinte à l'image)
- Les erreurs de saisie de l'Utilisateur
- La non-conformité fiscale ou juridique des documents émis
- La perte ou la non-conservation des documents non téléchargés
- Les litiges commerciaux entre l'Utilisateur et ses clients
- Les interruptions temporaires du service
- Les erreurs de taux de change saisis par l'Utilisateur
- Le non-respect par l'Utilisateur de ses obligations légales et fiscales

## Cas non excluables

Conformément à la loi, cette limitation ne s'applique pas en cas de :
- Faute lourde ou dolosive de MyCashBill
- Fraude
- Atteinte à la vie privée
- Violation d'une disposition légale impérative

Dans ces cas, la responsabilité de MyCashBill est engagée selon le droit commun.

## Recommandations à l'Utilisateur

MyCashBill recommande expressément :

1. **Télécharger chaque document immédiatement** après sa génération
2. **Conserver une copie** dans un système de sauvegarde personnel (cloud, disque externe)
3. **Vérifier la conformité fiscale** de chaque document avant envoi
4. **Consulter un expert-comptable** pour les questions fiscales complexes
5. **Vérifier les taux de change** avant tout envoi à un client à l'étranger

## Droit applicable

Droit camerounais. Juridiction compétente : tribunaux de Douala.

---

*Document de démonstration — à réviser par un avocat.*`,
    },
    {
      slug: 'refund',
      title: 'Politique de Remboursement',
      content: `# Politique de Remboursement

**Version 1.0 — En vigueur à compter du ${new Date().toLocaleDateString('fr-FR')}**

## Principe général

**Aucun remboursement n'est accordé après le début de la période souscrite**, sauf dans les cas limitativement énumérés ci-dessous.

## Cas de remboursement acceptés

### 1. Double paiement

Si un Utilisateur a été débité deux fois pour la même période, le trop-perçu est remboursé intégralement sous 14 jours ouvrés.

### 2. Erreur technique de facturation

En cas d'erreur manifeste de facturation de notre part (montant incorrect, devises erronées), remboursement intégral.

### 3. Défaillance prolongée du service

Si le service est indisponible de manière continue pendant plus de **7 jours consécutifs** pour des raisons techniques imputables à MyCashBill, remboursement au prorata des jours non utilisés.

## Procédure

1. Envoyer un email à support@mycashbill.app
2. Objet : « Demande de remboursement — [numéro de facture] »
3. Joindre : numéro de facture, capture d'écran du paiement, motif
4. Délai de traitement : 30 jours

## Cas NON remboursables

- Changement d'avis après souscription
- Utilisation partielle du service
- Suspension du compte pour violation des CGU
- Perte de documents due à la non-conservation par l'Utilisateur
- Frais de transaction Mobile Money (non récupérables auprès de l'opérateur)

## Modalités

Les remboursements sont effectués :
- Par le même moyen de paiement que celui utilisé
- En francs CFA (taux de change figé à la date du remboursement)

## Contact

support@mycashbill.app

---

*Document de démonstration.*`,
    },
  ];

  for (const page of legalPages) {
    for (const locale of ['FR', 'EN'] as const) {
      const content = locale === 'EN'
        ? page.content.replace(/France/g, 'France') // placeholder — traduction manuelle recommandée
        : page.content;
      const existing = await prisma.legalDocument.findFirst({
        where: { slug: page.slug, version: '1.0', locale },
      });
      if (!existing) {
        await prisma.legalDocument.create({
          data: {
            slug: page.slug,
            version: '1.0',
            locale,
            title: page.title,
            content,
            status: 'PUBLISHED',
            effectiveAt: new Date(),
            publishedAt: new Date(),
          },
        });
      }
    }
  }
  console.log('✅ Legal documents seeded');
}

// ─────────────────────────────────────────────
// Seed FAQ (~30 questions FR/EN)
// ─────────────────────────────────────────────
async function seedFAQ() {
  type FAQSeedItem = {
    category: 'account' | 'documents' | 'billing' | 'technical' | 'legal';
    order: number;
    locale: 'FR' | 'EN';
    question: string;
    answer: string;
    isPublished: boolean;
  };

  const faqItems: FAQSeedItem[] = [
    // ── ACCOUNT (6) ──
    {
      category: 'account',
      order: 1,
      locale: 'FR',
      question: 'Comment récupérer mon PIN ?',
      answer: 'Vous pouvez réinitialiser votre code PIN en utilisant l\'un de vos codes de secours générés lors de votre inscription. Si vous avez égaré vos codes de secours, contactez notre équipe support pour valider votre identité. MyCashBill est un outil technique d\'édition et n\'a pas accès à votre code secret chiffré. Pour les conditions de sécurité applicables, référez-vous à nos CGU.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 1,
      locale: 'EN',
      question: 'How do I recover my PIN?',
      answer: 'You can reset your PIN using one of the backup recovery codes provided during sign-up. If you have misplaced your recovery codes, contact our support team to verify your identity. MyCashBill is a technical document tool and cannot view your encrypted secret PIN. See our Terms of Service for full security terms.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 2,
      locale: 'FR',
      question: 'Puis-je changer de numéro de téléphone ?',
      answer: 'Votre numéro de téléphone constitue l\'identifiant unique et le garant de sécurité de votre compte MyCashBill. Pour transférer votre compte vers une nouvelle ligne, contactez notre support muni d\'un justificatif de titularité. MyCashBill applique ces contrôles techniques stricts pour prévenir toute usurpation. Consultez nos CGU pour plus d\'informations.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 2,
      locale: 'EN',
      question: 'Can I change my phone number?',
      answer: 'Your phone number serves as your unique account identifier and primary security checkpoint on MyCashBill. To transfer your workspace to a new number, please reach out to support with proof of line ownership. MyCashBill enforces these technical controls to prevent unauthorized takeovers. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 3,
      locale: 'FR',
      question: 'Comment supprimer mon compte ?',
      answer: 'Vous pouvez initier la suppression irréversible de votre compte depuis la page Paramètres ou en formulant une demande au support. Vos données personnelles seront anonymisées ou purgées sous 30 jours conformément à la réglementation. MyCashBill est un outil technique et ne conserve pas vos données indéfiniment. Consultez notre Politique de confidentialité et nos CGU.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 3,
      locale: 'EN',
      question: 'How do I delete my account?',
      answer: 'You can request account deletion from your Settings page or by contacting customer support. Your personal information will be permanently anonymized or deleted within 30 days in accordance with data regulations. MyCashBill is a technical editing tool and does not store data indefinitely. See our Privacy Policy and Terms of Service.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 4,
      locale: 'FR',
      question: 'Comment gérer mes appareils connectés ?',
      answer: 'Vous pouvez visualiser et révoquer instantanément chaque session active depuis l\'onglet Appareils de votre profil. Toute nouvelle tentative de connexion depuis un appareil inconnu fait l\'objet d\'une procédure de vérification. MyCashBill fournit ce mécanisme technique de surveillance pour votre sérénité. Référez-vous à nos CGU.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 4,
      locale: 'EN',
      question: 'How do I manage my linked devices?',
      answer: 'You can view and revoke any active session at any moment from the Devices section of your profile. Any connection attempt from an unapproved device requires verification. MyCashBill provides this technical monitoring mechanism to help safeguard your workspace. Refer to our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 5,
      locale: 'FR',
      question: 'Mes informations d\'entreprise peuvent-elles être modifiées ?',
      answer: 'Oui, vous pouvez actualiser à tout moment votre dénomination, adresse, logo, NIU et RCCM dans Paramètres > Entreprise. Vos nouveaux documents générés afficheront automatiquement ces mentions à jour. MyCashBill agit comme un outil d\'édition technique sans vérifier l\'exactitude administrative de vos déclarations. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 5,
      locale: 'EN',
      question: 'Can I update my company details?',
      answer: 'Yes, you can update your business name, address, logo, Tax ID, and trade register anytime under Settings > Business. All newly created documents will automatically reflect these modifications. MyCashBill acts solely as a technical formatting tool without verifying user declarations. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 6,
      locale: 'FR',
      question: 'Que faire en cas de connexion suspecte ?',
      answer: 'Déconnectez sans délai les appareils suspects depuis la section Appareils et renouvelez votre code PIN grâce à vos codes de secours. Notre système technique d\'alerte et de limitation de débit bloque les activités anormales. MyCashBill met en place ces garde-fous techniques pour assister les utilisateurs. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'account',
      order: 6,
      locale: 'EN',
      question: 'What should I do if I notice a suspicious login?',
      answer: 'Promptly revoke suspicious devices in your Devices section and reset your PIN code using your backup recovery keys. Our platform automatically throttles and flags abnormal access patterns. MyCashBill deploys these technical safeguards to assist users. Please review our Terms of Service.',
      isPublished: true,
    },

    // ── DOCUMENTS (8) ──
    {
      category: 'documents',
      order: 1,
      locale: 'FR',
      question: 'Comment créer une facture conforme au Cameroun ?',
      answer: 'Complétez vos mentions obligatoires (NIU, RCCM, centre des impôts) dans vos paramètres, puis créez un document en sélectionnant le type Facture et en ajoutant vos prestations ou articles. MyCashBill produit un PDF prêt à l\'impression muni d\'un QR Code de contrôle. MyCashBill est un outil technique de génération et ne délivre aucun conseil fiscal ; l\'émetteur demeure légalement responsable selon nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 1,
      locale: 'EN',
      question: 'How do I create a compliant invoice in Cameroon?',
      answer: 'Fill in your statutory credentials (Tax ID, RCCM, tax office) in settings, then create a document by choosing Invoice and detailing your items. MyCashBill generates an exportable print-ready PDF with a verification QR Code. MyCashBill is a technical tool and provides no legal or tax advice; compliance is the sole duty of the issuer per our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 2,
      locale: 'FR',
      question: 'Le NIU est-il obligatoire sur mes factures ?',
      answer: 'Oui, conformément aux directives du Code Général des Impôts, le Numéro d\'Identifiant Unique (NIU) doit figurer sur toutes les factures professionnelles émises au Cameroun et dans les juridictions CEMAC associées. MyCashBill vous propose les champs nécessaires pour l\'apposer sur vos documents. En tant qu\'outil technique, MyCashBill ne certifie pas la régularité fiscale de votre numéro. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 2,
      locale: 'EN',
      question: 'Is the Tax ID (NIU) mandatory on my invoices?',
      answer: 'Yes, in accordance with applicable tax codes, a Tax Identification Number (NIU) must appear on commercial invoices in Cameroon and related CEMAC jurisdictions. MyCashBill provides the dedicated input fields so it renders cleanly on your documents. As a technical tool, MyCashBill does not certify tax registration numbers. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 3,
      locale: 'FR',
      question: 'Quelle est la différence entre un Devis et une Facture Proforma ?',
      answer: 'Le devis détaille une offre tarifaire avant commande, tandis que la facture proforma est un document technique couramment exigé pour les formalités bancaires, douanières ou d\'importation. MyCashBill vous permet d\'émettre ces deux pièces en quelques clics selon vos besoins opérationnels. MyCashBill est un outil technique et n\'intervient pas dans vos relations contractuelles. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 3,
      locale: 'EN',
      question: 'What is the difference between a Quote and a Proforma Invoice?',
      answer: 'A quote outlines pricing prior to engagement, whereas a proforma invoice is a technical document requested by banking, customs, or procurement workflows. MyCashBill enables you to generate both formats with equal ease. MyCashBill operates strictly as a technical tool and assumes no contractual liability. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 4,
      locale: 'FR',
      question: 'Puis-je modifier ou supprimer une facture déjà émise ?',
      answer: 'Afin de respecter les principes comptables d\'intégrité et de traçabilité, une facture émise et numérotée ne doit pas être effacée. Il convient d\'émettre une facture rectificative ou un avoir pour corriger une transaction. MyCashBill applique une séquence de numérotation technique continue sans constituer un archivage certifié probant. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 4,
      locale: 'EN',
      question: 'Can I edit or delete an invoice that was already issued?',
      answer: 'To respect basic accounting integrity and sequential traceability, an issued invoice should not be deleted or retroactively altered. You should generate a corrective credit note or an adjusted invoice instead. MyCashBill enforces strict numbering sequences without offering certified legal archival. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 5,
      locale: 'FR',
      question: 'Comment partager un document via WhatsApp ?',
      answer: 'Depuis la fiche de votre document, cliquez sur l\'icône WhatsApp pour initier un message prêt à l\'envoi contenant le lien de consultation public sécurisé. Votre client peut consulter la facture sur son smartphone et télécharger le PDF directement. MyCashBill est un outil technique facilitant cette transmission sans enregistrer vos échanges. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 5,
      locale: 'EN',
      question: 'How do I share an invoice via WhatsApp?',
      answer: 'From the document detail screen, click the WhatsApp button to open a prefilled chat message containing the secure public link. Your client can inspect the invoice on mobile and download the PDF. MyCashBill facilitates this technical dispatch without storing your private chats. Consult our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 6,
      locale: 'FR',
      question: 'Comment fonctionne le QR Code présent sur mes factures ?',
      answer: 'Chaque document généré par MyCashBill intègre un QR Code menant à notre page publique de vérification d\'intégrité. Vos partenaires peuvent ainsi s\'assurer que les montants, les dates et l\'émetteur correspondent à l\'enregistrement initial. MyCashBill agit comme un outil technique d\'authentification cryptographique. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 6,
      locale: 'EN',
      question: 'How does the QR Code on my invoices work?',
      answer: 'Every document generated by MyCashBill features a QR Code resolving to our public cryptographic verification page. Partners and clients can confirm that amounts, dates, and issuer identity match original records. MyCashBill serves as a technical verification layer. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 7,
      locale: 'FR',
      question: 'Puis-je personnaliser le logo et l\'en-tête de mes factures ?',
      answer: 'Oui, les titulaires d\'un abonnement Pro peuvent importer leur logo professionnel et personnaliser les mentions de bas de page. Vos documents PDF seront exportés avec un rendu net et élégant reflétant votre identité. MyCashBill est un outil technique d\'édition et vous êtes responsable des visuels déposés. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 7,
      locale: 'EN',
      question: 'Can I customize the logo and header on my invoices?',
      answer: 'Yes, Pro subscribers can upload their official logo and configure custom header and footer notes. Generated PDF documents render crisp brand visuals for your company. MyCashBill provides the technical layout engine while you retain full responsibility for assets used. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 8,
      locale: 'FR',
      question: 'Qu\'est-ce que le bordereau de livraison et quand l\'utiliser ?',
      answer: 'Le bordereau de livraison est le document qui matérialise la remise des colis ou marchandises à votre destinataire, signé pour décharge. Vous pouvez le générer rapidement en reprenant les éléments de votre commande ou facture. MyCashBill prend en charge la mise en forme technique sans garantir la réalité du transport physique. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'documents',
      order: 8,
      locale: 'EN',
      question: 'What is a delivery slip and when should I use it?',
      answer: 'A delivery slip documents the physical handover of merchandise to your client, serving as an acknowledgment of receipt. You can generate it instantly from an existing order or invoice. MyCashBill provides technical document generation without certifying logistics execution. See our Terms of Service.',
      isPublished: true,
    },

    // ── BILLING (8) ──
    {
      category: 'billing',
      order: 1,
      locale: 'FR',
      question: 'Qu\'est-ce que l\'offre gratuite et quelles sont ses limites ?',
      answer: 'L\'offre gratuite vous permet de créer jusqu\'à 5 documents par mois avec un filigrane discret MyCashBill, sans frais ni engagement. Elle vous offre une prise en main complète de notre outil technique de facturation avant tout surclassement. MyCashBill ne garantit pas la conservation perpétuelle des documents du forfait gratuit. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 1,
      locale: 'EN',
      question: 'What is the free plan and what are its limits?',
      answer: 'The free plan allows you to generate up to 5 documents per month with a discreet MyCashBill watermark at zero cost. It offers full hands-on discovery of our technical invoicing software before upgrading. MyCashBill does not guarantee indefinite retention of free plan records. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 2,
      locale: 'FR',
      question: 'Qu\'est-ce que le trial Pro (période d\'essai) ?',
      answer: 'Dès votre inscription, vous disposez d\'un accès d\'essai Pro offert afin d\'expérimenter les documents illimités, l\'ajout de logo et la suppression du filigrane. À la fin de cette période, votre compte bascule automatiquement sur le plan gratuit sans aucun débit automatique. MyCashBill est un outil transparent ; consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 2,
      locale: 'EN',
      question: 'What is the Pro trial period?',
      answer: 'Upon signing up, you receive a complimentary Pro trial to test unlimited invoices, custom logo branding, and watermark removal. Once the trial ends, your account smoothly reverts to the free tier with no hidden charges. MyCashBill is a transparent technical service; see our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 3,
      locale: 'FR',
      question: 'Comment payer par Mobile Money ?',
      answer: 'Sur la page Passer Pro, choisissez votre opérateur (MTN Mobile Money ou Orange Money) et saisissez votre numéro de téléphone. Un message USSD s\'affiche sur votre mobile pour valider le paiement sécurisé de 2 000 FCFA pour un mois d\'accès. MyCashBill délègue le traitement aux passerelles de paiement bancaires agréées et ne conserve aucun code PIN. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 3,
      locale: 'EN',
      question: 'How do I pay using Mobile Money?',
      answer: 'On the Upgrade page, choose your mobile provider (MTN MoMo or Orange Money) and type in your phone number. A secure USSD prompt appears on your phone to confirm the 2,000 FCFA monthly payment. MyCashBill routes transactions through licensed gateways and never stores PIN codes. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 4,
      locale: 'FR',
      question: 'Puis-je payer par carte bancaire ?',
      answer: 'Oui, si vous résidez hors de la zone Mobile Money ou souhaitez régler par carte de crédit, vous pouvez payer en toute sécurité via notre partenaire certifié Notch Pay (Visa, Mastercard). Les fonds sont débités avec conversion automatique en devise locale. MyCashBill respecte les standards bancaires internationaux. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 4,
      locale: 'EN',
      question: 'Can I pay by debit or credit card?',
      answer: 'Yes, if Mobile Money is unavailable in your jurisdiction or you prefer using a card, you can settle your subscription securely via our certified partner Notch Pay (Visa, Mastercard). Transactions adhere to PCI-DSS payment standards. MyCashBill is a technical tool; see our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 5,
      locale: 'FR',
      question: 'Puis-je annuler à tout moment ?',
      answer: 'Oui, l\'abonnement Pro est sans engagement de durée. Lorsque vous décidez de ne pas reconduire votre mensualité, votre compte continue de bénéficier du Pro jusqu\'au terme des 30 jours réglés, puis bascule sur l\'offre gratuite. MyCashBill n\'applique aucune pénalité de résiliation. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 5,
      locale: 'EN',
      question: 'Can I cancel anytime?',
      answer: 'Yes, MyCashBill Pro subscriptions carry no long-term contracts. If you choose not to renew, your Pro benefits remain active until the end of your prepaid period before reverting to the free plan. MyCashBill charges no cancellation penalties. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 6,
      locale: 'FR',
      question: 'Comment fonctionne le parrainage ?',
      answer: 'Transmettez votre code parrain personnel à d\'autres professionnels. Dès qu\'un filleul s\'inscrit et émet son premier document valide, un mois Pro gratuit est crédité sur votre compte. MyCashBill utilise des algorithmes de contrôle anti-fraude pour valider l\'authenticité des filleuls. Consultez nos CGU pour les conditions d\'éligibilité.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 6,
      locale: 'EN',
      question: 'How does the referral program work?',
      answer: 'Share your personal referral code with friends and fellow business owners. As soon as your referral registers and creates their first valid document, you earn one free month of Pro. MyCashBill runs automated fraud checks to certify genuine referrals. Review our Terms of Service for eligibility criteria.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 7,
      locale: 'FR',
      question: 'Où trouver les factures de mes abonnements Pro ?',
      answer: 'Une quittance officielle au format PDF est émise pour chaque abonnement validé et demeure consultable dans la section Mes abonnements. Vous pouvez la télécharger à tout instant pour votre comptabilité. MyCashBill délivre cette pièce en qualité d\'outil technique d\'édition. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 7,
      locale: 'EN',
      question: 'Where can I find invoices for my Pro subscription?',
      answer: 'An official PDF receipt is generated for each settled payment and remains downloadable inside your Subscriptions section. You can download it anytime for expense accounting. MyCashBill produces this document as a technical invoicing provider. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 8,
      locale: 'FR',
      question: 'Que se passe-t-il si une transaction est interrompue ?',
      answer: 'En cas d\'interruption réseau ou de refus bancaire, aucun débit n\'est retenu et vous pouvez renouveler l\'opération à tout moment. Votre compte conserve ses privilèges jusqu\'à l\'échéance préalablement acquittée. MyCashBill ne prélève aucun frais en cas d\'échec de paiement. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'billing',
      order: 8,
      locale: 'EN',
      question: 'What happens if a payment transaction is interrupted?',
      answer: 'If a payment fails due to network timeout or insufficient balance, your balance remains untouched and you can retry when ready. Your account maintains its active privileges until its scheduled expiration date. MyCashBill never charges fees for failed transactions. See our Terms of Service.',
      isPublished: true,
    },

    // ── TECHNICAL (4) ──
    {
      category: 'technical',
      order: 1,
      locale: 'FR',
      question: 'L\'app fonctionne-t-elle hors ligne ?',
      answer: 'Oui, MyCashBill est une Progressive Web App (PWA) conçue avec un support hors ligne robuste. Vous pouvez éditer vos documents sans connexion réseau, et la synchronisation avec la base de données s\'effectue dès le retour d\'Internet. MyCashBill fournit cette ergonomie technique moderne. Consultez nos CGU.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 1,
      locale: 'EN',
      question: 'Does the application work offline?',
      answer: 'Yes, MyCashBill is engineered as an installable Progressive Web App (PWA) with offline-first capabilities. You can create invoices without an internet connection, and data synchronizes automatically once connectivity resumes. MyCashBill provides this technical convenience. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 2,
      locale: 'FR',
      question: 'Où sont stockés mes documents ?',
      answer: 'Vos données et documents sont hébergés sur des infrastructures cloud sécurisées bénéficiant de sauvegardes récurrentes et de connexions chiffrées HTTPS/TLS. Les accès d\'authentification sont hachés de manière irréversible via Argon2id. MyCashBill applique ces standards techniques de protection. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 2,
      locale: 'EN',
      question: 'Where are my documents stored?',
      answer: 'Your documents and data are hosted on secure cloud infrastructure featuring automated backups and strict TLS/HTTPS encryption. Secret credentials and PINs are irreversibly hashed with Argon2id. MyCashBill implements these technical protection standards. Consult our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 3,
      locale: 'FR',
      question: 'Comment installer MyCashBill sur mon smartphone ?',
      answer: 'Rendez-vous sur mycashbill.app depuis Chrome ou Safari mobile, puis cliquez sur le menu de navigation et sélectionnez « Ajouter à l\'écran d\'accueil ». Vous disposerez d\'une application native avec icône dédiée et affichage fluide sans barre de navigateur. MyCashBill est un outil technique optimisé pour la mobilité. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 3,
      locale: 'EN',
      question: 'How do I install MyCashBill on my phone?',
      answer: 'Navigate to mycashbill.app on mobile Safari or Chrome, tap the browser menu, and choose "Add to Home Screen". The app will open like a native application with dedicated icons and fast screen transitions. MyCashBill is a technical tool built for mobile entrepreneurs. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 4,
      locale: 'FR',
      question: 'Comment exporter mes factures et données ?',
      answer: 'Vous pouvez exporter l\'intégralité de vos documents au format PDF ou sous forme d\'archive ZIP groupée directement depuis l\'écran Historique. MyCashBill garantit la portabilité complète de vos données techniques sans restriction. En tant qu\'outil technique, MyCashBill vous recommande d\'archiver ces copies sur vos supports personnels. Voir nos CGU.',
      isPublished: true,
    },
    {
      category: 'technical',
      order: 4,
      locale: 'EN',
      question: 'How do I export my invoices and records?',
      answer: 'You can export all issued documents as individual PDFs or as a combined ZIP archive from the History tab. MyCashBill provides open data portability with zero vendor lock-in. As a technical tool, MyCashBill advises preserving backup copies on your personal storage. See our Terms of Service.',
      isPublished: true,
    },

    // ── LEGAL (4) ──
    {
      category: 'legal',
      order: 1,
      locale: 'FR',
      question: 'MyCashBill est-il un logiciel de comptabilité ou un expert-comptable ?',
      answer: 'Non, MyCashBill est exclusivement un outil technique d\'édition et d\'impression de documents commerciaux. La plateforme ne délivre aucun conseil juridique, fiscal, comptable ou financier et ne saurait remplacer les missions d\'un expert-comptable inscrit à l\'ordre. L\'exactitude des mentions et montants relève de la seule responsabilité de l\'utilisateur selon nos CGU.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 1,
      locale: 'EN',
      question: 'Is MyCashBill an accounting software or a certified accountant?',
      answer: 'No, MyCashBill is exclusively a technical creation and formatting tool for commercial invoices. It does not provide legal, accounting, tax, or financial counsel, nor does it substitute for certified public accountants. Users bear full responsibility for the accuracy of their entries under our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 2,
      locale: 'FR',
      question: 'MyCashBill assure-t-il l\'archivage à valeur probante (SAE) ?',
      answer: 'Non, MyCashBill n\'est pas un système d\'archivage électronique à valeur probante (SAE) au sens réglementaire. Les factures sont stockées pour faciliter votre gestion courante, mais vous devez exporter et conserver vos justificatifs selon les durées légales prévues par le droit fiscal de votre pays. Référez-vous à nos CGU.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 2,
      locale: 'EN',
      question: 'Does MyCashBill provide legal evidentiary archival (SAE)?',
      answer: 'No, MyCashBill is not an authorized electronic archival system (SAE) with legal evidentiary certification. Documents are saved for standard operational convenience; users are required to download and maintain books per national statutory record retention rules. See our Terms of Service.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 3,
      locale: 'FR',
      question: 'Comment mes données personnelles sont-elles protégées ?',
      answer: 'Nous appliquons des mesures rigoureuses de protection des données conformes aux réglementations applicables (RGPD et lois nationales sur la protection des données personnelles). Vos données ne sont ni vendues ni communiquées à des régies publicitaires. Vous disposez d\'un droit continu d\'accès, de rectification et d\'effacement. Consultez notre Politique de confidentialité et nos CGU.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 3,
      locale: 'EN',
      question: 'How is my personal data protected?',
      answer: 'We enforce stringent data privacy practices in alignment with applicable privacy laws and GDPR standards. Your data is never sold or shared with third-party advertisers. You maintain perpetual rights of access, correction, and erasure. Refer to our Privacy Policy and Terms of Service.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 4,
      locale: 'FR',
      question: 'Que faire en cas de différend avec un client sur une facture ?',
      answer: 'MyCashBill fournit les éléments techniques d\'intégrité (QR Code, horodatage, hash cryptographique) pour justifier de l\'état initial de la facture émise. Néanmoins, MyCashBill n\'est pas partie prenante aux relations commerciales, accords ou litiges entre vous et vos clients. Consultez nos CGU pour connaître les limitations de responsabilité.',
      isPublished: true,
    },
    {
      category: 'legal',
      order: 4,
      locale: 'EN',
      question: 'What if I have a dispute with a client over an invoice?',
      answer: 'MyCashBill delivers technical integrity elements (QR Code, timestamp, cryptographic checksum) verifying the document\'s unaltered state. However, MyCashBill never intervenes in commercial contracts or client disputes. Consult our Terms of Service regarding platform limitations of liability.',
      isPublished: true,
    },
  ];

  for (const item of faqItems) {
    const existing = await prisma.fAQEntry.findFirst({
      where: { locale: item.locale, question: item.question },
    });
    if (!existing) {
      await prisma.fAQEntry.create({ data: item });
    } else {
      await prisma.fAQEntry.update({
        where: { id: existing.id },
        data: item,
      });
    }
  }
  console.log('✅ FAQ entries seeded (30 questions FR/EN)');
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Seed Blog Articles
// ─────────────────────────────────────────────
async function seedArticles() {
  const articles: Array<{
    slug: string;
    locale: Locale;
    title: string;
    excerpt: string;
    authorName: string;
    tags: string[];
    status: ArticleStatus;
    seoTitle: string;
    seoDescription: string;
    readingTime: number;
    content: string;
  }> = [
    {
      slug: 'mentions-obligatoires-facture-cameroun',
      locale: 'FR',
      title: 'Les mentions obligatoires sur une facture au Cameroun',
      excerpt: 'Découvrez toutes les mentions obligatoires à faire figurer sur une facture conforme selon le Code Général des Impôts au Cameroun et le droit commercial OHADA.',
      authorName: 'Équipe Fiscale MyCashBill',
      tags: ['facturation', 'fiscalite', 'cameroun', 'entreprise'],
      status: 'PUBLISHED',
      seoTitle: 'Mentions obligatoires d\'une facture au Cameroun : Guide CGI 2026',
      seoDescription: 'Guide complet des mentions obligatoires sur une facture conforme au Cameroun selon le Code Général des Impôts (NIU, RCCM, TVA, régimes).',
      readingTime: 6,
      content: `## Pourquoi la conformité de vos factures est cruciale au Cameroun

Dans le contexte économique camerounais et l'espace OHADA, émettre une facture ne se résume pas à inscrire un montant sur une feuille volante ou dans un message informel. La facture constitue à la fois un **acte juridique probant**, un **justificatif comptable obligatoire** et le support fondamental de l'assujettissement fiscal devant la Direction Générale des Impôts (DGI).

Une facture non conforme expose votre entreprise à des sanctions sévères : rejet de déductibilité des charges pour vos clients, application d'amendes fiscales prévues par le Code Général des Impôts (CGI), voire litiges commerciaux irrécupérables en cas de procédure de recouvrement judiciaire.

---

## Les 7 mentions obligatoires selon le Code Général des Impôts

Pour être juridiquement et fiscalement inattaquable au Cameroun, chaque facture commerciale doit impérativement comporter les éléments suivants :

### 1. Identification complète de l'émetteur
Votre entreprise doit être identifiée sans ambiguïté :
- **Raison sociale ou Nom commercial** complet.
- **Forme juridique** (ETS, SARL, SAS, SA) et capital social le cas échéant.
- **Numéro d'Identifiant Unique (NIU)** attribué par la DGI (14 caractères alphanumériques).
- **Numéro du Registre du Commerce et du Crédit Mobilier (RCCM)**.
- **Adresse géographique et siège social** (ville, quartier, boîte postale).
- **Numéro de téléphone et adresse électronique**.

### 2. Informations obligatoires relatives au client
Le client professionnel doit faire l'objet d'une identification précise :
- Nom commercial ou nom et prénom.
- NIU du client (obligatoire pour les transactions B2B afin d'autoriser la déductibilité fiscale de la charge).
- Adresse physique ou localisation commerciale.

### 3. Numéro de facture chronologique et séquentiel
Chaque document doit porter un numéro unique fondé sur une série chronologique continue et sans rupture (par exemple : *MCB-2026-000124*). La numérotation rétroactive ou l'effacement de factures émises est formellement prohibé.

### 4. Date d'émission et date d'exigibilité
La date à laquelle la prestation a été achevée ou les marchandises livrées, ainsi que la date limite de paiement convenue entre les parties.

### 5. Description détaillée des biens et services
Pour chaque ligne d'article ou de service :
- Libellé explicite de la marchandise ou de la prestation fournie.
- Quantité vendue.
- Prix unitaire Hors Taxe (HT).
- Réductions de prix éventuelles (rabais, remises, ristournes).

### 6. Ventilation fiscale : Montant HT, TVA et TTC
Si vous êtes assujetti à la TVA :
- Montant total Hors Taxes (HT).
- Taux de TVA applicable (taux légal de 19,25% au Cameroun, incluant les Centimes Additionnels Communaux).
- Montant total de la TVA collectée.
- Montant global Toutes Taxes Comprises (TTC) libellé en FCFA (XAF).
- Si votre structure relève du Régime de l'Impôt Libératoire ou du Régime Simplifié non collecteur de TVA, la mention explicite : *« TVA non applicable — Régime Simplifié »* doit figurer sur la facture.

### 7. Modalités de règlement et coordonnées de paiement
Indiquez clairement comment régler : RIB bancaire, compte Mobile Money professionnel (Orange Money ou MTN Mobile Money), et délai accordé (comptant, 15 jours, 30 jours fin de mois).

---

## Exemple concret d'une facture conforme

Imaginons une prestation de conseil facturée 500 000 FCFA HT à Douala par une SARL assujettie au Réel :
- **Montant brut HT** : 500 000 FCFA
- **Taux TVA** : 19,25%
- **Montant TVA** : 96 250 FCFA
- **Net à payer TTC** : 596 250 FCFA

Le document doit en outre préciser la mention de dispense ou de précompte éventuel (acompte d'impôt sur le revenu retenu à la source par les grandes entreprises et organismes publics).

---

## Les sanctions en cas de facture irrégulière

Selon le Livre des Procédures Fiscales du CGI camerounais :
- **Amende de 100 000 FCFA à 5 000 000 FCFA** pour absence de mentions légales ou facturation non conforme.
- **Rejet de la déduction de TVA** pour votre acheteur professionnel.
- **Sanctions pour fausse facturation** pouvant entraîner la suspension du compte fiscal en ligne de la DGI.

---

## Comment MyCashBill garantit votre conformité

En utilisant notre solution de facturation professionnelle, l'ensemble de ces règles est automatisé :
1. Calcul automatique et exact de la TVA à 19,25%.
2. Numérotation atomique continue et inviolable.
3. QR Code de vérification d'intégrité numérique apposé sur chaque document.
4. Génération instantanée au format PDF normalisé A4 ou Ticket thermique.

Pour plus de précisions sur les règles contractuelles et juridiques applicables à nos services, consultez nos [Conditions Générales d'Utilisation](/fr/legal/cgu) ainsi que nos [Mentions Légales](/fr/legal/mentions-legales).`
    },
    {
      slug: 'tva-19-25-cameroun-calcul-guide',
      locale: 'FR',
      title: 'TVA 19,25% : qui est concerné et comment la calculer',
      excerpt: 'Comprendre le taux de TVA à 19,25% au Cameroun (17,5% + CAC 10%), les régimes fiscaux assujettis, et les formules de calcul HT et TTC avec exemples.',
      authorName: 'Équipe Fiscale MyCashBill',
      tags: ['tva', 'fiscalite', 'cameroun', 'comptabilite'],
      status: 'PUBLISHED',
      seoTitle: 'TVA à 19,25% au Cameroun : Calcul, Régimes et Guide Fiscal 2026',
      seoDescription: 'Guide complet du calcul de la TVA à 19,25% au Cameroun. Formules HT/TTC, régimes réel et simplifié, Centimes Additionnels Communaux.',
      readingTime: 5,
      content: `## Les fondamentaux de la Taxe sur la Valeur Ajoutée au Cameroun

La Taxe sur la Valeur Ajoutée (TVA) est un impôt indirect sur la consommation pesant sur l'utilisateur final. Au Cameroun, elle est régie par les articles 125 et suivants du Code Général des Impôts (CGI).

---

## Pourquoi 19,25% et non 17,5% ? La règle des CAC

Beaucoup d'entrepreneurs s'interrogent sur l'origine du taux effectif de **19,25%**. 

La décomposition légale est la suivante :
1. **Taux de base de la TVA** : 17,5%
2. **Centimes Additionnels Communaux (CAC)** : 10% calculés sur le montant principal de la TVA (soit 10% de 17,5% = 1,75%).
3. **Taux global effectif** : 17,5% + 1,75% = **19,25%**.

Lorsque vous appliquez la TVA sur vos produits ou prestations de services, vous devez toujours appliquer ce coefficient global de 19,25%.

---

## Qui doit collecter et reverser la TVA ?

Tous les commerçants ou prestataires ne sont pas habilités à facturer la TVA :

### 1. Le Régime du Réel (Chiffre d'affaires > 50 millions FCFA)
Les entreprises relevant du régime du Réel sont **obligatoirement collectrices de TVA**. Elles doivent :
- Facturer la TVA à 19,25% sur toutes leurs ventes imposables.
- Déduire la TVA payée sur leurs achats professionnels légitimes.
- Déclarer et reverser la différence (TVA collectée – TVA déductible) mensuellement avant le 15 de chaque mois auprès de leur Centre des Impôts de rattachement.

### 2. Le Régime Simplifié (Chiffre d'affaires entre 10 et 50 millions FCFA)
Sauf option volontaire pour le régime du réel validée par la DGI, les structures du Régime Simplifié ne facturent pas la TVA et ne peuvent pas la récupérer sur leurs achats.

### 3. Les opérations exonérées par la loi
Certains biens et services de première nécessité sont exonérés de TVA au Cameroun :
- Produits alimentaires de base non transformés (riz, farine, pain, lait).
- Médicaments et produits pharmaceutiques essentiels.
- Prestations d'enseignement et de formation professionnelle agréées.
- Opérations d'assurance vie et certains crédits bancaires.

---

## Formules mathématiques et exemples de calcul

### 1. Calculer le montant TTC à partir du montant HT
Pour obtenir le montant Toutes Taxes Comprises :
$\\text{TVA} = \\text{Montant HT} \\times 0{,}1925$
$\\text{Montant TTC} = \\text{Montant HT} \\times 1{,}1925$

**Exemple :**
Vente de matériel informatique d'une valeur de 400 000 FCFA HT :
- TVA = 400 000 × 0,1925 = **77 000 FCFA**
- TTC = 400 000 + 77 000 = **477 000 FCFA**

### 2. Extraire le montant HT à partir d'un prix TTC
Si vous convenez d'un prix forfaitaire TTC avec votre client, appliquez le diviseur 1,1925 :
$\\text{Montant HT} = \\frac{\\text{Montant TTC}}{1{,}1925}$
$\\text{TVA} = \\text{Montant TTC} - \\text{Montant HT}$

**Exemple :**
Prestation facturée 1 000 000 FCFA TTC :
- Montant HT = 1 000 000 / 1,1925 = **838 574,42 FCFA**
- TVA collectée = 1 000 000 – 838 574,42 = **161 425,58 FCFA**

---

## Facturation de la TVA sur MyCashBill

Sur MyCashBill, les calculs de TVA s'opèrent avec une précision au centime près, éliminant tout risque d'erreur d'arrondi fiscal. Lors de la création de vos factures et devis, l'outil ventile automatiquement les bases HT, les lignes de TVA et le total TTC.

Pour en savoir plus sur les responsabilités fiscales de l'utilisateur, référez-vous à nos [Conditions Générales d'Utilisation](/fr/legal/cgu).`
    },
    {
      slug: '10-astuces-vendre-sur-whatsapp',
      locale: 'FR',
      title: '10 astuces pour vendre efficacement sur WhatsApp',
      excerpt: 'Guide complet pour transformer vos discussions WhatsApp en commandes fermes : catalogue, relances professionnelles, factures PDF et paiement mobile.',
      authorName: 'Équipe Commerciale MyCashBill',
      tags: ['whatsapp', 'vente', 'ecommerce', 'mobile-money'],
      status: 'PUBLISHED',
      seoTitle: '10 astuces pour vendre sur WhatsApp en Afrique (Guide 2026)',
      seoDescription: 'Comment vendre plus sur WhatsApp Business : profil, catalogue, relances non intrusives, factures professionnelles et paiement Mobile Money.',
      readingTime: 6,
      content: `## Le commerce conversationnel : le canal n°1 en Afrique

En Afrique francophone, WhatsApp n'est plus une simple application de messagerie : c'est le principal canal de vente, de prospection et de relation client pour des millions de PME, créateurs de mode, grossistes et prestataires de services.

Néanmoins, vendre sur WhatsApp requiert une rigueur professionnelle pour convertir un simple prospect curieux en acheteur fidèle. Voici 10 stratégies concrètes pour maximiser vos encaissements.

---

## Les 10 astuces incontournables

### 1. Migrer impérativement vers WhatsApp Business
Téléchargez WhatsApp Business pour bénéficier d'outils clés : horaires d'ouverture, adresse physique, description de votre activité et lien vers votre catalogue.

### 2. Soigner votre catalogue de produits
Présentez vos articles avec des photos de haute qualité sous lumière naturelle, en mentionnant explicitement le prix en FCFA et les délais de livraison. L'opacité sur les tarifs fait fuir 60% des prospects.

### 3. Exploiter les étiquettes pour segmenter vos contacts
Attribuez des étiquettes de couleur à chaque conversation :
- *Nouveau prospect*
- *Devis envoyé*
- *En attente de paiement*
- *Commande livrée*

### 4. Répondre en moins de 15 minutes
Sur WhatsApp, l'attention d'un prospect s'évapore rapidement. Configurer des messages de réponse rapide (ex: */prix*, */livraison*) pour répondre instantanément aux interrogations récurrentes.

### 5. Utiliser les statuts WhatsApp comme vitrine quotidienne
Publiez régulièrement en évitant le spam (3 à 5 statuts par jour maximum) :
- Arrivage de nouveautés
- Preuves sociales (captures de retours clients satisfaits)
- Coulisses de fabrication ou de préparation de colis

### 6. Remplacer les simples messages textes par des devis formels
Lorsqu'un prospect demande un devis, ne vous contentez pas de taper les chiffres dans le fil de discussion. Émettez un **devis PDF propre**, avec votre logo et vos conditions de validité. Le taux de conversion d'un devis formel est trois fois supérieur.

### 7. Simplifier le paiement Mobile Money
Ne demandez pas à vos clients de recopier un numéro personnel avec risque d'erreur. Utilisez des liens de paiement ou mentionnez clairement les références du compte marchand (*Orange Money Marchand* ou *MTN MoMo Business*).

### 8. Sécuriser les transactions par une facture dès réception des fonds
Dès que le paiement Mobile Money est confirmé, envoyez immédiatement une facture acquittée avec mention du solde nul. Cela renforce la confiance et supprime toute contestation future.

### 9. Pratiquer la relance de courtoisie sans harceler
Si un prospect ne donne plus de nouvelles après envoi d'une proposition :
- **À J+1** : *« Bonjour [Prénom], avez-vous pu consulter notre devis pour [Produit] ? Je reste disponible si vous avez une question sur les spécifications. »*
- **À J+4** : *« Bonjour [Prénom], nos stocks sur cette référence sont limités cette semaine. Souhaitez-vous que nous vous réservions votre commande ? »*

### 10. Fidéliser avec des listes de diffusion consenties
Créez des listes de diffusion pour informer vos clients de remises exclusives, en respectant leur vie privée conformément à notre [Politique de Confidentialité](/fr/legal/politique-confidentialite).

---

## Pourquoi MyCashBill est le compagnon idéal de WhatsApp

Avec MyCashBill :
- Générez un devis ou une facture en 30 secondes sur votre smartphone.
- Partagez le PDF directement dans la conversation WhatsApp en un clic.
- Ajoutez des boutons de règlement rapides Mobile Money sur vos devis.

Pour découvrir l'ensemble de nos fonctionnalités et nos engagements de service, consultez nos [Conditions Générales d'Utilisation](/fr/legal/cgu).`
    },
    {
      slug: 'devis-facture-proforma-differences',
      locale: 'FR',
      title: 'Devis, facture, proforma : quelle différence ?',
      excerpt: 'Ne confondez plus devis, facture proforma et facture définitive : découvrez leurs valeurs juridiques respectives, obligations comptables et cas d\'usage.',
      authorName: 'Équipe Fiscale MyCashBill',
      tags: ['devis', 'proforma', 'facturation', 'droit-des-affaires'],
      status: 'PUBLISHED',
      seoTitle: 'Devis, Facture, Proforma : Quelles différences juridiques et comptables ?',
      seoDescription: 'Guide pratique pour distinguer devis, facture proforma et facture commerciale définitive en droit OHADA et fiscalité africaine.',
      readingTime: 5,
      content: `## Clarification des trois documents commerciaux fondamentaux

Dans la gestion quotidienne d'une entreprise, les termes **devis**, **facture proforma** et **facture définitive** sont fréquemment employés de manière interchangeable. Pourtant, au regard du droit commercial OHADA et du droit fiscal, chacun de ces documents répond à une finalité spécifique et n'engage pas les parties de la même façon.

---

## 1. Le Devis : L'offre contractuelle préalable

### Qu'est-ce qu'un devis ?
Le devis est une **proposition commerciale écrite** par laquelle un prestataire ou un vendeur détaille la nature de sa prestation, ses tarifs et ses conditions d'exécution, avant tout engagement du client.

### Valeur juridique
Tant que le client n'a pas manifesté son accord, le devis n'engage que son émetteur (qui est tenu de respecter les prix indiqués pendant la durée de validité mentionnée). Une fois revêtu de la mention *« Bon pour accord »*, daté et signé par le client, le devis devient un **contrat commercial synallagmatique** engageant fermement les deux parties.

### Impact comptable
Le devis n'a **aucune valeur comptable ni fiscale**. Il n'est jamais enregistré dans le journal des ventes et ne donne lieu à aucune exigibilité de TVA.

---

## 2. La Facture Proforma : Une facture pour la forme

### Qu'est-ce qu'une proforma ?
L'expression latine *pro forma* signifie « pour la forme ». Il s'agit d'un document qui reprend la présentation rigoureuse d'une facture définitive mais qui n'en a pas le statut légal.

### Cas d'usage fréquents
- **Demande de financement bancaire** : l'acheteur remet la proforma à sa banque pour solliciter un prêt ou un déblocage de fonds.
- **Procédures douanières et import/export** : déclaration de la valeur prévisionnelle en douane.
- **Obtention d'autorisations administratives** ou de subventions publiques.
- **Bons de commande institutionnels** dans les grandes entreprises ou ONG.

### Valeur juridique et comptable
La facture proforma n'a **pas de valeur probante de créance**. Elle ne permet pas d'exiger un paiement devant les tribunaux et ne peut pas être déduite fiscalement. Elle ne donne lieu à aucun enregistrement dans les livres de comptes.

---

## 3. La Facture Définitive : Le titre exécutoire de la vente

### Qu'est-ce qu'une facture ?
La facture définitive est le document obligatoire émis lors de la livraison du bien ou de l'achèvement de la prestation de service.

### Caractéristiques majeures
1. **Obligation légale** : Tout acte commercial B2B ou toute vente au consommateur qui en fait la demande doit faire l'objet d'une facture.
2. **Caractère irrévocable** : Une facture émise ne peut jamais être purement et simplement effacée ; toute correction doit faire l'objet d'une note d'avoir (*avoir fiscal*).
3. **Exigibilité fiscale** : Elle déclenche l'obligation de déclarer et reverser la TVA ainsi que le chiffre d'affaires imposable.
4. **Titre de créance** : Elle autorise les procédures de mise en demeure et d'injonction de payer en cas de défaut de règlement.

---

## Tableau comparatif récapitulatif

| Critère | Devis | Facture Proforma | Facture Définitive |
| :--- | :--- | :--- | :--- |
| **Moment d'émission** | Avant la commande | Phase de négociation / démarche | Après accord ou réalisation |
| **Obligation comptable** | Aucune | Aucune | Obligatoire |
| **Valeur juridique** | Contrat si signé | Information indicative | Titre de créance légale |
| **Exigibilité de la TVA** | Non | Non | Oui |
| **Possibilité d'annuler** | Simple annulation | Caducité automatique | Note d'avoir obligatoire |

---

## La chaîne documentaire simplifiée sur MyCashBill

Avec MyCashBill, passez d'un devis ou d'une proforma à une facture définitive en un seul clic, sans risque de ressaisie ou d'erreur de numéro séquentiel.

Pour plus d'informations sur l'archivage et l'intégrité de vos pièces commerciales, consultez nos [Mentions Légales](/fr/legal/mentions-legales) et nos [Conditions Générales d'Utilisation](/fr/legal/cgu).`
    },
    {
      slug: 'relance-client-gestion-impayes',
      locale: 'FR',
      title: 'Relance client et gestion des impayés : sécuriser sa trésorerie',
      excerpt: 'Stratégies éprouvées pour anticiper les retards de paiement, structurer un calendrier de relance amiable et préserver sa trésorerie sans froisser la relation client.',
      authorName: 'Équipe Financière MyCashBill',
      tags: ['tresorerie', 'relance-client', 'gestion', 'impayes'],
      status: 'PUBLISHED',
      seoTitle: 'Gestion des Impayés et Relance Client en Afrique : Méthodes et Scripts',
      seoDescription: 'Comment réduire les délais de paiement et gérer les retards clients sans dégrader la relation commerciale. Guide et calendrier de relance.',
      readingTime: 6,
      content: `## L'impact critique des retards de paiement sur les TPE et PME

En Afrique subsaharienne, plus de 70% des défaillances d'entreprises ne sont pas causées par un déficit de rentabilité, mais par une crise aiguë de trésorerie provoquée par des retards de paiement chroniques.

Vendre est une chose, être payé en est une autre. Sans un processus systématique de suivi et de recouvrement amiable, les créances clients s'accumulent et menacent la pérennité de votre activité.

---

## Les réflexes préventifs : anticiper avant l'échéance

Le moyen le plus efficace de gérer les impayés est d'éviter qu'ils ne se produisent :

### 1. Fixer des conditions de paiement claires dès le départ
Indiquez explicitement sur vos devis et factures :
- Le délai de règlement accordé (ex: *Paiement comptant*, *30 jours net*).
- Les pénalités applicables en cas de retard de paiement.
- L'exigence systématique d'un **acompte de 30% à 50%** à la commande pour les prestations de services ou fabrications sur-mesure.

### 2. Émettre la facture immédiatement
Ne laissez jamais s'écouler plusieurs jours entre la livraison et l'envoi de la facture. Plus le document tarde à parvenir au client, plus son règlement sera reporté.

---

## Le calendrier progressif de relance amiable

Une relance efficace repose sur une gradation mesurée du ton :

### Étape 1 : Le rappel préventif (J-3 avant échéance)
Un simple message courtois par email ou WhatsApp pour s'assurer que la facture a bien été intégrée dans le calendrier de décaissement du client :
> *« Bonjour [Nom du contact], nous espérons que vous êtes satisfait de [Produit/Service]. Pour faciliter votre gestion, nous vous rappelons que la facture n° [Numéro] arrive à échéance le [Date]. Nous restons à votre disposition. »*

### Étape 2 : La relance de courtoisie (J+3 après échéance)
À ce stade, l'oubli involontaire est l'hypothèse la plus probable :
> *« Bonjour [Nom], sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture n° [Numéro] de [Montant] FCFA échue le [Date]. Vous trouverez notre RIB et coordonnées Mobile Money ci-joint. Merci de nous tenir informés. »*

### Étape 3 : La relance ferme par appel direct (J+10 après échéance)
Privilégiez le contact vocal direct avec le décideur ou le responsable financier. Demandez un engagement ferme sur une date de virement ou de transfert Mobile Money.

### Étape 4 : La mise en demeure formelle (J+25 après échéance)
En cas de silence persistant ou de promesses non tenues, adressez une lettre recommandée avec accusé de réception ou un exploit d'huissier valant mise en demeure formelle de payer sous huit jours, préalable indispensable à toute action en justice devant le tribunal de commerce compétent.

---

## Comment MyCashBill protège vos encaissements

Grâce aux tableaux de bord et indicateurs de suivi de MyCashBill :
- Visualisez immédiatement vos factures en retard de paiement.
- Partagez des relances directes avec lien de facture sécurisé sur WhatsApp.
- Gardez une traçabilité totale des échanges et des paiements partiels enregistrés.

Pour toute question relative aux règles de preuve et à la conservation des documents, veuillez consulter nos [Conditions Générales d'Utilisation](/fr/legal/cgu).`
    }
  ];

  for (const a of articles) {
    await prisma.article.upsert({
      where: {
        slug_locale: {
          slug: a.slug,
          locale: a.locale,
        },
      },
      update: {
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        authorName: a.authorName,
        tags: a.tags,
        status: a.status,
        published: true,
        publishedAt: new Date('2026-01-15T08:00:00.000Z'),
        seoTitle: a.seoTitle,
        seoDescription: a.seoDescription,
        readingTime: a.readingTime,
      },
      create: {
        slug: a.slug,
        locale: a.locale,
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        authorName: a.authorName,
        tags: a.tags,
        status: a.status,
        published: true,
        publishedAt: new Date('2026-01-15T08:00:00.000Z'),
        seoTitle: a.seoTitle,
        seoDescription: a.seoDescription,
        readingTime: a.readingTime,
      },
    });
  }
  console.log('✅ Blog articles seeded (5 pillar articles PUBLISHED)');
}

async function main() {
  await seedAdmin();
  await seedCountries();
  await seedThresholds();
  await seedLegal();
  await seedFAQ();
  await seedArticles();
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
