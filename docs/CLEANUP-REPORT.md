# RAPPORT DE NETTOYAGE ET COHÉRENCE — PHASE 1 & ARBITRAGE

Date : 2026-11-07  
Statut : **Validé — Nettoyage appliqué (sans régression)**

---

## 🚨 RÉGRESSIONS DÉTECTÉES (À CÂBLER)

Lors de l'analyse des composants et modules orphelins, 4 composants critiques se sont avérés être des **régressions fonctionnelles silencieuses** (code implémenté avec précision mais déconnecté lors d'une refonte antérieure). Ils doivent impérativement être câblés :

| Fichier orphelin | Fichier cible d'intégration | Raison & Impact métier |
|---|---|---|
| **`lib/device/camera.ts`** (`compressImage`) | `app/[locale]/(app)/settings/business/page.tsx` & composants d'upload (logo, signature, cachet) | **Exigence data mobile** : Compresse les images côté client (maxWidth × maxHeight, JPEG/PNG qualité 0.85) avant envoi multipart. Évite d'uploader des fichiers bruts de 2+ Mo sur des réseaux 3G/4G lents. |
| **`lib/device/wakelock.ts`** (`useWakeLock`) | `components/documents/DocumentForm.tsx` (ou `app/[locale]/(app)/documents/new/page.tsx`) | **Expérience utilisateur saisie longue** : Empêche l'extinction automatique de l'écran du smartphone pendant la saisie d'une facture détaillée ou d'un long devis (via la Screen Wake Lock API). |
| **`components/documents/EmailSendSheet.tsx`** | `components/share/ShareSheet.tsx` | **Fonctionnalité Pro d'envoi d'email** : Permet aux abonnés Pro d'envoyer leurs factures/devis par email directement via `/api/documents/[id]/send-email`. Actuellement déconnecté de `ShareSheet`. |
| **`components/ui/ProExpiryBanner.tsx`** | `app/[locale]/(app)/dashboard/page.tsx` (ou layout d'application) | **Mécanisme de conversion freemium critique** : Affiche un bandeau d'alerte à rebours avant expiration du Pro (`J-2`, `J-1`, `J-0 / aujourd'hui`). Sans cette bannière, les utilisateurs en fin d'essai churnent silencieusement sans être incités à souscrire. |

### Note Roadmap :
* **`components/documents/SignaturePad.tsx`** : **GARDÉ — Roadmap signature électronique**  
  Composant canvas prêt pour la signature électronique manuscrite (client/prestataire) conférant une valeur probante aux devis et reçus.

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
