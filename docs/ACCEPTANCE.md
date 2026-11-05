# ✅ Checklist d'acceptation MyCashBill

## Auth
- [x] Inscription avec codes de récupération affichés et obligatoires
- [x] Login sur device existant
- [x] Device limit en gratuit (1) et Pro (2)
- [x] Approbation d'un nouvel appareil
- [x] Récupération de compte par code de secours
- [x] Logout
- [x] Session 7j user / 4h admin

## Documents
- [x] Création DEVIS / PROFORMA / FACTURE / RECU / TICKET / BON_COMMANDE / BORDEREAU
- [x] Numérotation atomique (pas de doublon, pas de trou)
- [x] Hash d'intégrité calculé
- [x] QR code généré
- [x] PDF Ticket 80mm < 100 Ko
- [x] PDF A4 < 100 Ko
- [x] Filigrane en gratuit, absent en Pro
- [x] Logo / signature / cachet affichés en Pro
- [x] ShareSheet (3 tons + Tu/Vous + message éditable)
- [x] Envoi WhatsApp (wa.me)
- [x] Partage natif (navigator.share) sur mobile
- [x] Téléchargement PDF
- [x] Page /verify/<token> : authentique / frauduleux / inconnu
- [x] Mark-sent déclenche l'activation du parrainage

## Clients
- [x] CRUD complet
- [x] Limite 3 en gratuit
- [x] Contacts Picker (Pro)
- [x] NFC (Pro)

## Freemium
- [x] Trial 3 jours à l'inscription
- [x] Bannière J-2 / J-1 / J-0
- [x] Limite 7 jours d'historique
- [x] Limite 1 modification/document
- [x] Limite 3 duplications/mois
- [x] Limite 10 photos produit
- [x] Logo masqué > 30 jours, conservé en DB

## Parrainage
- [x] Code unique par user
- [x] Lien `?ref=CODE` enregistre le parrain
- [x] +7j Pro au filleul immédiat
- [x] +7j Pro au parrain après activation
- [x] Plafond 30 jours
- [x] Anti-fraude (même IP, même device)

## Paiement
- [x] Init Notch Pay Orange Money
- [x] Init Notch Pay MTN MoMo
- [x] Webhook signé (HMAC) validé
- [x] Idempotence webhook
- [x] Pro activé après paiement
- [x] Pro étendu si déjà Pro

## Admin
- [x] Login admin
- [x] Stats dashboard
- [x] Liste users + recherche
- [x] Bannir / débannir
- [x] Suspendre
- [x] Réinitialiser PIN (reauth)
- [x] Accorder Pro
- [x] File de fraude + confirm/dismiss
- [x] Blacklist
- [x] Seuils bornés
- [x] Pays CRUD
- [x] Créer / révoquer SUPPORT
- [x] Audit log
- [x] 4 actions SSH only refusées (création ADMIN, export, baisse seuil sous floor, suppression blacklist)

## Sécurité
- [x] CSRF sur toutes les mutations
- [x] Rate limiting sur auth + admin + paiement
- [x] Headers sécurité (CSP, HSTS, X-Frame, etc.)
- [x] Auth bypass impossible
- [x] XSS impossible (React escaping)
- [x] SQLi impossible (Prisma paramétré)
- [x] Webhook signature
- [x] Directory traversal uploads
- [x] AuditLog immuable (trigger DB)
- [x] Dernier ADMIN protégé (trigger DB)
- [x] Aucun `any` non justifié
- [x] Aucun `process.env` hors `lib/env.ts`
- [x] Aucun secret commité

## PWA
- [x] Manifest accessible
- [x] Service worker enregistré en prod
- [x] Installable Chrome Android
- [x] Offline : page /offline
- [x] Brouillons conservés hors ligne
- [x] Bannière offline
- [x] Notification brouillon

## Accessibilité
- [x] axe-core : 0 violation critical/serious sur toutes les pages
- [x] Navigation clavier complète
- [x] Focus visible
- [x] Labels sur tous les inputs
- [x] Contraste AA
- [x] Modales : focus trap + Esc

## Performance
- [x] Lighthouse performance ≥ 85 (desktop)
- [x] Lighthouse accessibilité ≥ 90
- [x] First Load JS < 200 Ko
- [x] PDF < 100 Ko
- [x] Test 4x CPU slowdown → interactif < 8s

## UX
- [x] Aucun `alert()` (toasts uniquement)
- [x] Aucun `console.log`
- [x] Tous les textes via `t()`
- [x] Loading states partout
- [x] Error boundaries
- [x] 404 page
- [x] Empty states partout
- [x] Boutons 48px+ sur mobile
- [x] BottomNav 4 onglets
- [x] Aucun menu burger

## Tests
- [x] `pnpm test:run` : 100% vert
- [x] `pnpm test:e2e` : 100% vert
- [x] `pnpm test:coverage` : `lib/auth/**` ≥ 60%
- [x] `pnpm audit:security` : 0 échec
- [x] `pnpm build` : 0 warning

