# RAPPORT DE NETTOYAGE ET COHÉRENCE (LECTURE SEULE)

Date : 2026-11-07  
Statut : **Lecture seule — Aucune suppression effectuée**

---

## 1.1 — Imports morts
*Méthode : Analyse statique ESLint (`unused-imports` / `@typescript-eslint/no-unused-vars`).*

* **Total détecté :** **0**
* **Détail :** Aucun import mort présent dans le codebase.

---

## 1.2 — Exports jamais importés & Fichiers orphelins
*Méthode : Recherche de références croisées de chaque module dans `lib/` et `components/`.*

| Fichier | Export(s) principal(aux) | Vérification manuelle / Statut |
|---|---|---|
| `lib/device/camera.ts` | `compressImage()` | ⚠️ **Orphelin** : Aucun import dans tout le projet. Destiné à la compression d'image client avant upload. |
| `lib/device/wakelock.ts` | `useWakeLock()` | ⚠️ **Orphelin** : Aucun import dans tout le projet. Hook Screen Wake Lock API. |
| `components/documents/EmailSendSheet.tsx` | `EmailSendSheet` | ⚠️ **Orphelin** : Aucun import. Appelle `/api/documents/[id]/send-email`. À conserver ou intégrer si prévu dans la roadmap. |
| `components/documents/SignaturePad.tsx` | `SignaturePad` | ⚠️ **Orphelin** : Aucun import. Composant de signature manuscrite sur canvas. |
| `components/ui/ProExpiryBanner.tsx` | `ProExpiryBanner` | ⚠️ **Orphelin** : Aucun import. Bandeau d'expiration Pro non connecté. |

---

## 1.3 — Fichiers vides ou stub (< 3 lignes utiles)
*Méthode : Comptage des lignes non vides dans `app/`, `lib/`, `components/`.*

| Fichier | Lignes | Analyse |
|---|---|---|
| `app/[locale]/(admin)/admin/dashboard/page.tsx` | 1 | ✅ **GARDER** : `export { default } from '../page';` (alias Next.js App Router pour route `/admin/dashboard`). |

*Aucun fichier vide ou stub non fonctionnel trouvé.*

---

## 1.4 — Références fantômes

### A. CashBill vs MyCashBill
* **Occurrences "CashBill" sans préfixe "My" :** **0 anomalie**
  * Seule occurrence détectée : `app/[locale]/(auth)/layout.tsx:43` : `My<span className="text-sage-600">CashBill</span>` (séparation purement visuelle pour la colorisation du logo).
  * Toutes les mentions publiques, métadonnées, mentions légales et templates d'emails utilisent rigoureusement **MyCashBill**.

### B. Session Cookie
* `lib/constants.ts:10` : `export const SESSION_COOKIE = 'mycashbill_session';`
* Utilise bien le nom d'application unifié `mycashbill_session`.

### C. Anciens préfixes `CB-`
* **Occurrences de `'CB-` :** **0**
* Les documents et factures utilisent tous le préfixe unifié `MCB-` (`MCB-F-`, `MCB-DEV-`, `MCB-SUB-`).

---

## 1.5 — Code commenté
*Méthode : Regex `^\s*//.*(function|const|return|if|for|await|=>)` sur `app/`, `lib/`, `components/`.*

* **Total lignes détectées :** 19
* **Analyse :** **0 code mort commenté.**  
  Toutes les 19 lignes sont des commentaires d'explication métier en français (ex: `// Vérifie que...`, `// Si indicatif sans '+'...`, `// Révoquer la vérification...`, `// Client-side CSRF...`). Aucun bloc de code exécutable n'est laissé en commentaire.

---

## 1.6 — console.log / console.debug / console.info
*Méthode : Recherche de `console.(log|debug|info)` dans `app/`, `lib/`, `components/`.*

* **Total :** **0**
* Le monitoring applicatif n'utilise que `console.error` et `console.warn` sur les erreurs rattrapées et non bloquantes, conformément aux standards de production.

---

## 1.7 — any non justifiés
*Méthode : Recherche de `: any`, `<any>`, `as any` sans commentaire `// justified`.*

* **Total :** **0**
* Tous les casts dans l'application sont typés avec des interfaces explicites ou dérivés de types stricts (`unknown as Parameters<typeof fn>[0]`). Aucun type `any` non contrôlé.

---

## 1.8 — TODO / FIXME / HACK / XXX
*Méthode : Recherche insensible à la casse sur l'ensemble du code applicatif.*

* **Total :** **0**
* Aucun marqueur temporaire ou dette technique explicite dans les sources.

---

## 1.9 — Dépendances package.json non utilisées
*Méthode : Recherche d'imports et d'utilisation dans les scripts de build/test.*

| Dépendance | Type | Statut & Recommandation |
|---|---|---|
| `ulid` | Production | ⚠️ **CANDIDAT À LA SUPPRESSION** : Jamais importé ni utilisé dans le projet (le projet utilise Prisma CUID et `crypto.randomUUID()`). |
| `react-dom` | Production | ✅ **GARDER** : Dépendance peer obligatoire de Next.js 15 & React 19. |
| `@lhci/cli` | Dev | ✅ **GARDER** : Utilisé dans le script `audit:lighthouse`. |
| `dotenv-cli` | Dev | ✅ **GARDER** : Utilisé dans `scripts.test:run`, `scripts.test:setup`, etc. |
| `prettier-plugin-tailwindcss` | Dev | ✅ **GARDER** : Plugin Prettier de formatage CSS Tailwind. |

---

## 1.10 — Cohérence i18n
*Méthode : Comparaison des clés aplaties entre `messages/fr.json` et `messages/en.json`.*

* **Nombre total de clés FR :** 564
* **Nombre total de clés EN :** 564
* **Clés manquantes en EN :** **0**
* **Clés manquantes en FR :** **0**
* **Parité :** **100% parfaite.**

---

## 1.11 — Routes API jamais appelées depuis le client

| Route | Fichier | Type d'appel / Statut |
|---|---|---|
| `/api/cron/recurring` | `app/api/cron/recurring/route.ts` | ✅ **GARDER** : Appelé par le scheduler Cron externe / Vercel Cron. |
| `/api/health` | `app/api/health/route.ts` | ✅ **GARDER** : Endpoint de health check / monitoring ping. |
| `/api/auth/device-approval/request` | `app/api/auth/device-approval/request/route.ts` | ℹ️ **Backend prêt** : Endpoint d'approbation d'appareil. |
| `/api/documents/[id]/send-email` | `app/api/documents/[id]/send-email/route.ts` | ℹ️ **Lié à `EmailSendSheet`** : Appelé par le composant `EmailSendSheet.tsx`. |

---

## 1.12 — Composants jamais importés

| Composant | Fichier | Utilisation prévue |
|---|---|---|
| `EmailSendSheet` | `components/documents/EmailSendSheet.tsx` | Feuille d'envoi de facture/devis par email. |
| `SignaturePad` | `components/documents/SignaturePad.tsx` | Pavé de signature manuscrite pour les reçus/devis. |
| `ProExpiryBanner` | `components/ui/ProExpiryBanner.tsx` | Bandeau d'alerte visuelle quand Pro expire sous 3 jours. |

---

## Synthèse & Recommandations

1. **Qualité globale du code exceptionnelle :**
   - 0 import mort, 0 `console.log`, 0 `any` non justifié, 0 TODO, 100% de parité i18n.
   - Cohérence totale de la marque **MyCashBill** et des préfixes **MCB-**.

2. **Éléments soumis à validation de l'utilisateur pour suppression ou conservation :**
   - **Dépendance npm :** `ulid` (inutilisée, remplaçable sans impact).
   - **Fichiers utilitaires d'appareils non connectés :** `lib/device/camera.ts`, `lib/device/wakelock.ts`.
   - **Composants en réserve :** `EmailSendSheet.tsx`, `SignaturePad.tsx`, `ProExpiryBanner.tsx`.

