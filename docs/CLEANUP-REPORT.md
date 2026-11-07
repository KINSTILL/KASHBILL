# RAPPORT DE NETTOYAGE ET COHÉRENCE — PHASE 1 & ARBITRAGE

Date : 2026-11-07  
Statut : **Validé — Nettoyage appliqué (sans régression)**

---

## 🚨 RÉGRESSIONS DÉTECTÉES (CÂBLÉES ET VALIDÉES)

Lors de l'analyse des composants et modules orphelins, 4 composants critiques se sont avérés être des **régressions fonctionnelles silencieuses**. Ils ont tous été **câblés, testés et validés en production** :

| Fichier | Fichier cible d'intégration | Statut | Raison & Impact métier |
|---|---|---|---|
| **`lib/device/camera.ts`** (`compressImage`) | `components/documents/ImagePicker.tsx` | ✅ **Câblé** | **Exigence data mobile** : Compresse les images côté client (maxWidth × maxHeight, JPEG/PNG qualité 0.85) avant envoi multipart. Évite d'uploader des fichiers bruts de 2+ Mo sur des réseaux 3G/4G lents. |
| **`lib/device/wakelock.ts`** (`useWakeLock`) | `components/documents/DocumentForm.tsx` | ✅ **Câblé** | **Expérience utilisateur saisie longue** : Empêche l'extinction automatique de l'écran du smartphone pendant la saisie d'une facture détaillée ou d'un long devis (via la Screen Wake Lock API). |
| **`components/documents/EmailSendSheet.tsx`** | `components/share/ShareSheet.tsx` | ✅ **Câblé** | **Fonctionnalité Pro d'envoi d'email** : Permet aux abonnés Pro (et aux comptes gratuits dans la limite de leur quota) d'envoyer leurs factures/devis par email directement via `/api/documents/[id]/send-email`. |
| **`components/ui/ProExpiryBanner.tsx`** | `app/[locale]/(app)/dashboard/page.tsx` | ✅ **Câblé** | **Mécanisme de conversion freemium critique** : Affiche un bandeau d'alerte à rebours avant expiration du Pro (`J-2`, `J-1`, `J-0 / aujourd'hui`). Sans cette bannière, les utilisateurs en fin d'essai churnent silencieusement sans être incités à souscrire. |

### Note Roadmap :
* **`components/documents/SignaturePad.tsx`** : **GARDÉ — Roadmap signature électronique**  
  Composant canvas prêt pour la signature électronique manuscrite (client/prestataire) conférant une valeur probante aux devis et reçus.

---

## ⚡ LIMITES FREEMIUM, QUOTAS & CONVERSION PRO (DÉPLOYÉS)

1. **Quotas mensuels gratuits ([`lib/constants.ts`](file:///c:/Users/Famille%20Mouelnjock/Documents/KASHBILL/lib/constants.ts) & [`lib/quota/check.ts`](file:///c:/Users/Famille%20Mouelnjock/Documents/KASHBILL/lib/quota/check.ts)) :**
   - Documents : 10 / mois
   - Envois WhatsApp : 5 / mois
   - Emails envoyés : 1 / mois
   - Clients enregistrés : 2
   - Période d'essai Pro à l'inscription : 5 jours
2. **Contrôle d'accès & API :**
   - Vérification stricte des quotas sur `POST /api/documents`, `POST /api/clients`, `POST /api/documents/[id]/mark-sent`, `POST /api/documents/[id]/send-email`.
   - Route `/api/me/quota` pour interroger l'état en temps réel.
3. **UI de conversion :**
   - [`QuotaBadge.tsx`](file:///c:/Users/Famille%20Mouelnjock/Documents/KASHBILL/components/layout/QuotaBadge.tsx) dans le header pour les comptes gratuits avec jauge et modal de mise à niveau.
   - Filigrane renforcé (bandeau orange + filigrane diagonal massif + footer) sur [`TicketTemplate.tsx`](file:///c:/Users/Famille%20Mouelnjock/Documents/KASHBILL/lib/pdf/templates/TicketTemplate.tsx) et [`A4Template.tsx`](file:///c:/Users/Famille%20Mouelnjock/Documents/KASHBILL/lib/pdf/templates/A4Template.tsx).
   - Bouton « 💎 Voir cette facture en version Pro » avec modal explicatif et aperçu dynamique sans filigrane ([`ProPreviewToggle.tsx`](file:///c:/Users/Famille%20Mouelnjock/Documents/KASHBILL/components/documents/ProPreviewToggle.tsx)).

---

## 1.1 — Imports morts
*Méthode : Analyse statique ESLint.*

* **Total :** **0**
* Le codebase ne présente aucun import mort.

---

## 1.2 — Exports jamais importés & Fichiers orphelins
* Les fichiers `lib/device/camera.ts`, `lib/device/wakelock.ts`, `components/documents/EmailSendSheet.tsx`, `components/documents/SignaturePad.tsx`, `components/ui/ProExpiryBanner.tsx` sont **tous conservés sans exception** (voir section Régressions ci-dessus).

---

## 1.3 — Fichiers vides ou stub
* **`app/[locale]/(admin)/admin/dashboard/page.tsx`** (1 ligne) : **GARDÉ**  
  `export { default } from '../page';` (alias App Router nécessaire pour `/admin/dashboard`).

---

## 1.4 — Références fantômes
* **CashBill sans My :** **0 anomalie** (`My<span className="text-sage-600">CashBill</span>` est un découpage purement typographique pour colorer le logo).
* **Session Cookie :** `mycashbill_session` (unifié).
* **Préfixes documents :** **0** `'CB-'` (tous les documents et factures utilisent `MCB-`).

---

## 1.5 — Code commenté
* **0 code mort commenté.**  
  Les 19 occurrences détectées sont des commentaires d'explication métier en français (ex: `// Vérifie que...`, `// Client-side CSRF...`).

---

## 1.6 — console.log / console.debug / console.info
* **Total :** **0** dans `app`, `lib`, `components`. Seuls `console.error` et `console.warn` subsistent pour le monitoring des exceptions non bloquantes.

---

## 1.7 — any non justifiés
* **Total :** **0** (codebase 100% en typage strict TypeScript).

---

## 1.8 — TODO / FIXME / HACK / XXX
* **Total :** **0**

---

## 1.9 — Dépendances package.json
* **`ulid`** : **SUPPRIMÉE**  
  Inutilisée dans le projet (Prisma utilise CUID et le code applicatif utilise `crypto.randomUUID()`). Retirée de `package.json` et de `pnpm-lock.yaml`.
* Les autres dépendances (`react-dom`, `@lhci/cli`, `dotenv-cli`, `prettier-plugin-tailwindcss`) sont toutes utilisées et conservées.

---

## 1.10 — Cohérence i18n
* **Total clés FR :** 564
* **Total clés EN :** 564
* **Clés manquantes EN :** 0
* **Clés manquantes FR :** 0
* **Parité :** **100% parfaite.**

---

## 1.11 — Routes API
* `/api/cron/recurring` : ✅ Cron Vercel / externe.
* `/api/health` : ✅ Monitoring ping.
* `/api/auth/device-approval/request` : ✅ Endpoint d'approbation d'appareil.
* `/api/documents/[id]/send-email` : ✅ Liée à `EmailSendSheet`.
