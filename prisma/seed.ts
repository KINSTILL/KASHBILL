/* eslint-disable no-console */
import { PrismaClient, Role } from '@prisma/client';
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

MyCashBill SARL, [adresse à compléter], Douala, Cameroun. Contact : privacy@mycashbill.app

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

Pour exercer ces droits : privacy@mycashbill.app. Réponse sous 30 jours.

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

Pour toute question : privacy@mycashbill.app

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
- Email : contact@mycashbill.app

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
// Main
// ─────────────────────────────────────────────
async function main() {
  await seedAdmin();
  await seedCountries();
  await seedThresholds();
  await seedLegal();
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
