# Suivis (points d'attention non bloquants)

Points notés lors de l'itération « Aperçu PDF + Email/Bluetooth Premium + Bilinguisme ».
À traiter dans une passe de nettoyage/robustesse ultérieure.

## Sécurité / Secrets
- [ ] `.env*` non lisibles/éditables via l'IDE (sécurité) → modification via terminal uniquement.
- [ ] `RESEND_API_KEY` est désormais **requis** dans tous les environnements (validation `lib/env.ts`).
      En prod : clé Resend réelle + domaine `mycashbill.app` vérifié (SPF/DKIM).

## Tests manuels restants (nécessitent un appareil physique)
- [ ] Aperçu PDF iOS (Safari) : message `iosPreviewHelp` + bouton « Ouvrir le PDF ».
- [ ] Envoi email réel (Pro) : toast succès + email reçu avec PDF joint.
- [ ] Partage natif (Pro, Android) : menu natif (Bluetooth, Gmail, AirDrop…).
- [ ] Gating gratuit : boutons Email / Partager grisés avec badge Pro + toast `premiumOnly`.

## Robustesse / Code
- [ ] L'email ne déclenche volontairement **pas** l'activation du parrainage (pas d'abus de
      `sentViaWhatsAppAt`). À documenter si le comportement doit changer.

## Nettoyage dépôt
- [ ] Réécrire `README.md` (actuellement boilerplate create-next-app).
- [ ] Nettoyer `scratch/` (fichiers de travail temporaires).
- [ ] Supprimer `step_3620_content.txt` à la racine.
- [ ] Ignorer/supprimer les logs générés (`install_resend.log`, `lint.log`, `test.log`, `build.log`).
