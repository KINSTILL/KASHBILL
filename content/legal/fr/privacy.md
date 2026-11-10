---
title: "Politique de Confidentialité"
version: "1.2"
effectiveDate: "2026-11-09"
---

# Politique de Confidentialité

**Dernière mise à jour :** 9 novembre 2026 · **Version 1.2**

Conformément à la **loi camerounaise n°2024/017 du 23 décembre 2024** relative à la protection des données à caractère personnel.

---

## 1. Responsable du traitement

Le Responsable de Traitement est :

- **DANY**, entrepreneur individuel
- **Adresse :** Douala, Cameroun
- **NIU :** P118816334425R
- **Contact :** support@mycashbill.app

**Aucun Délégué à la Protection des Données (DPO) distinct n'est désigné.** Toute demande relative aux données personnelles doit être adressée à support@mycashbill.app.

---

## 2. Double rôle : Responsable et Sous-traitant

### 2.1 — Responsable de Traitement (données du compte)

L'Éditeur est **Responsable de Traitement** pour les données du compte de l'Utilisateur : téléphone, PIN haché, profil, logs techniques, historique d'abonnement.

### 2.2 — Sous-traitant (données des clients finaux)

L'Éditeur agit comme **simple Sous-traitant technique** pour les données des clients finaux saisies par l'Utilisateur dans ses documents (noms, adresses, identifiants fiscaux, montants).

**L'Utilisateur est le seul Responsable de Traitement** de ces données. Il garantit disposer des droits et consentements nécessaires pour les traiter. L'Éditeur s'engage à :

- traiter ces données uniquement selon les instructions de l'Utilisateur ;
- ne jamais les utiliser à des fins propres (marketing, revente) ;
- les supprimer sur simple demande écrite ;
- notifier toute violation à l'Utilisateur sous 48 heures.

---

## 3. Données collectées

### 3.1 — Données d'identification du compte

- **Numéro de téléphone** (identifiant de connexion unique)
- **Code PIN à 6 chiffres haché** avec l'algorithme **argon2id** (jamais stocké en clair, jamais accessible même par l'Éditeur)
- **Nom d'affichage, raison sociale, ville** (optionnels)
- **Adresse email** (optionnelle, utilisée uniquement pour l'envoi des factures d'abonnement et le support)
- **Codes de récupération hachés** (argon2id, jamais stockés en clair)
- **Identifiants fiscaux** (NIU, RCCM, forme juridique, adresse légale — optionnels, renseignés par l'Utilisateur)

### 3.2 — Données d'édition (contenus créés par l'Utilisateur)

- Données textuelles saisies dans les documents (noms de clients, descriptions, prix, taxes, montants, notes)
- Logo, signature, cachet, en-tête et pied de page personnalisés
- CGV personnalisées de l'Utilisateur

### 3.3 — Données de paiement d'abonnement

- Historique des transactions d'abonnement (montant, date, statut, référence Notch Pay)
- **Aucune donnée bancaire complète n'est stockée** (numéro de carte, CVV, PIN Mobile Money). Ces données sont traitées exclusivement par Notch Pay.

### 3.4 — Données techniques et de sécurité

- **Adresse IP** (conservée 90 jours maximum, pour la sécurité et la prévention de la fraude)
- **User-Agent** (navigateur, appareil)
- **Device ID** (identifiant d'appareil pour la gestion des sessions)
- **Logs techniques** (erreurs, requêtes API, horodatage)
- **Logs d'audit** (actions sensibles : inscription, connexion, révocation, récupération)

### 3.5 — Données NON collectées

L'Éditeur **ne collecte PAS** : données de localisation GPS, données biométriques, données de santé, données politiques/religieuses/syndicales, données bancaires complètes, données de mineurs de moins de 18 ans.

---

## 4. Bases légales du traitement

| Type de donnée | Base légale |
|---|---|
| Téléphone, PIN, nom, raison sociale, ville | **Exécution du contrat** |
| Adresse email | **Exécution du contrat** (factures, notifications de sécurité) |
| Identifiants fiscaux (NIU, RCCM) | **Exécution du contrat** (génération de documents) |
| Données des clients finaux | **Exécution du contrat** (génération à la demande de l'Utilisateur) |
| Historique des abonnements | **Obligation légale** (conservation comptable 10 ans) |
| Logs d'audit | **Intérêt légitime** (sécurité, prévention de la fraude) |
| Adresse IP, User-Agent | **Intérêt légitime** (sécurité, prévention des abus) |
| Cookies analytiques | **Consentement** (opt-in, révocable) |

---

## 5. Finalités du traitement

1. **Création et gestion du compte** : inscription, authentification, profil
2. **Fourniture du Service** : génération, stockage et partage de documents
3. **Gestion des abonnements** : paiement, facturation, renouvellement
4. **Support client** : réponse aux demandes via support@mycashbill.app
5. **Sécurité** : prévention de la fraude, détection des abus
6. **Obligations légales** : conservation des factures, coopération avec les autorités sur réquisition
7. **Amélioration du Service** (si consentement) : analyse statistique agrégée et anonymisée

**Aucune donnée n'est utilisée à des fins de prospection commerciale, de revente ou de profilage sans consentement explicite.**

---

## 6. Destinataires et sous-traitants

L'Éditeur **ne vend, ne loue et ne commercialise aucune donnée personnelle**.

Les données sont hébergées ou traitées uniquement par des sous-traitants techniques indispensables :

### 6.1 — Hébergement

- **Contabo GmbH** — Aschauer Straße 32a, 81549 München, Allemagne
- **Localisation des serveurs :** Allemagne (Union Européenne)
- **Rôle :** hébergement de l'application et de la base de données

### 6.2 — Paiement d'abonnement

- **Notch Pay** — agrégateur de paiement agréé (Cameroun)
- **Rôle :** traitement des transactions Mobile Money et carte bancaire
- **Note :** Notch Pay est seul Responsable de Traitement pour les données bancaires collectées directement auprès de l'Utilisateur

### 6.3 — Emails transactionnels

- **Resend** — service d'emailing (États-Unis)
- **Rôle :** envoi des factures d'abonnement et notifications de sécurité
- **Note :** Resend n'a accès qu'à l'adresse email et au contenu de l'email envoyé

### 6.4 — Autorités

Les données peuvent être communiquées aux **autorités camerounaises ou internationales compétentes** sur réquisition judiciaire ou administrative, dans les strictes limites prévues par la loi.

---

## 7. Transferts internationaux

| Sous-traitant | Pays | Garanties |
|---|---|---|
| Contabo GmbH | Allemagne (UE) | Niveau de protection adéquat reconnu par la loi n°2024/017 |
| Resend | États-Unis | Clauses Contractuelles Types (SCC) de la Commission Européenne |

Conformément à l'**article 44 de la loi n°2024/017**, l'Éditeur s'assure que tout transfert hors Cameroun bénéficie de garanties appropriées.

---

## 8. Durées de conservation

| Type de donnée | Durée |
|---|---|
| Compte actif | Tant que le compte existe |
| Compte supprimé (soft delete) | **30 jours** (récupération possible) puis anonymisation |
| Documents générés (offre gratuite) | **30 jours** |
| Documents générés (offre Pro) | **365 jours** |
| Logs d'audit | **12 mois** |
| Logs techniques (IP, erreurs) | **90 jours** |
| Factures d'abonnement | **10 ans** (obligation comptable et fiscale) |
| Données de paiement Notch Pay | Gérées par Notch Pay selon sa politique |
| Cookies analytiques | **12 mois** maximum |
| Codes de récupération utilisés | Supprimés immédiatement après usage |

**Les données sont effectivement supprimées à l'expiration de ces durées par un processus automatique quotidien.** Les fichiers PDF associés aux documents expirés sont également supprimés du stockage.

---

## 9. Sécurité

### 9.1 — Mesures techniques

- **Chiffrement des communications** : HTTPS/TLS obligatoire
- **Hachage des secrets** : PIN et codes de récupération avec **argon2id**
- **Chiffrement au repos** : les signatures, logos et cachets sont chiffrés sur disque avec **AES-256-GCM**
- **Cookies de session** : JWT signés, cookies httpOnly
- **Protection CSRF** : header X-Requested-With obligatoire sur les mutations
- **Rate limiting** : limitation des tentatives d'authentification et des abus
- **Audit log immuable** : traçabilité de toutes les actions sensibles (trigger DB)
- **Sauvegardes** : base de données sauvegardée quotidiennement

### 9.2 — Mesures organisationnelles

- Accès aux données restreint au strict nécessaire
- Aucun accès de l'Éditeur au PIN ou aux codes de récupération (hachés)
- Procédure de réponse aux incidents documentée

### 9.3 — Limites

**Aucun système n'est infaillible.** L'Éditeur ne peut garantir une sécurité absolue. En cas de faille, l'Éditeur s'engage à notifier les Utilisateurs concernés dans les meilleurs délais.

---

## 10. Violation de données

En cas de violation de données personnelles, l'Éditeur s'engage à :

1. **Notifier l'autorité de contrôle camerounaise compétente** dans un délai de **72 heures** après en avoir pris connaissance (art. 41 loi n°2024/017).
2. **Informer les Utilisateurs concernés** dans les meilleurs délais (email + notification in-app) si la violation est susceptible d'engendrer un risque élevé pour leurs droits.
3. **Documenter l'incident** dans un registre interne.
4. **Mettre en œuvre les mesures correctives** nécessaires.

---

## 11. Droits de l'Utilisateur

Conformément à la loi n°2024/017, l'Utilisateur dispose des droits suivants :

- **Accès** : obtenir une copie de ses données (format JSON ou CSV)
- **Rectification** : corriger toute donnée inexacte ou incomplète
- **Effacement** (droit à l'oubli) : suppression des données, sous réserve des obligations légales de conservation (factures d'abonnement : 10 ans)
- **Limitation** : suspension temporaire du traitement
- **Opposition** : s'opposer au traitement pour motifs légitimes
- **Portabilité** : recevoir ses données dans un format structuré et lisible par machine
- **Retrait du consentement** : à tout moment, pour les traitements basés sur le consentement

**Pour exercer ces droits :** support@mycashbill.app

**L'Éditeur répond dans un délai maximum de 30 jours** à compter de la réception de la demande. En cas de demande complexe, ce délai peut être prolongé de 30 jours supplémentaires, avec information préalable.

---

## 12. Cookies

L'utilisation des cookies est détaillée dans la **Politique de Cookies** accessible à https://mycashbill.app/fr/legal/cookies.

L'Utilisateur peut à tout moment gérer ses préférences via le bandeau cookies ou les paramètres de son navigateur.

---

## 13. Mineurs

Le Service est **strictement réservé aux personnes âgées de 18 ans et plus**. L'Éditeur ne collecte pas sciemment de données de mineurs. Si l'Éditeur découvre qu'un compte a été créé par un mineur, il procédera à sa suppression immédiate.

---

## 14. Autorité de contrôle et droit de plainte

Conformément à la loi n°2024/017, l'Utilisateur dispose du droit d'introduire une réclamation auprès de l'**autorité de contrôle camerounaise compétente en matière de protection des données personnelles** s'il estime, après avoir contacté l'Éditeur, que ses droits ne sont pas respectés.

L'Utilisateur est invité à contacter préalablement l'Éditeur à **support@mycashbill.app** pour rechercher une solution amiable.

---

## 15. Modification de la Politique

L'Éditeur se réserve le droit de **modifier la présente Politique à tout moment**, notamment pour se conformer aux évolutions légales, réglementaires ou techniques.

La version en vigueur est celle publiée à la date de consultation. Les modifications majeures feront l'objet d'une notification aux Utilisateurs inscrits. La poursuite de l'utilisation du Service après modification vaut acceptation de la nouvelle Politique.

---

## 16. Limitation de responsabilité

Dans toute la mesure permise par le droit applicable, la **responsabilité totale et cumulée** de DANY envers un Utilisateur, en lien avec le traitement des données personnelles, est **strictement limitée au plus faible des deux montants suivants** :

- **(a)** le montant total effectivement payé par l'Utilisateur au cours des **douze (12) derniers mois** ;
- **(b)** un plafond absolu de **dix mille (10 000) francs CFA**.

Pour l'Utilisateur de l'offre gratuite, ce plafond est de **zéro (0) franc CFA**.

Cette limitation **ne s'applique pas** en cas de faute lourde ou dolosive, de fraude, ou de violation d'une disposition légale impérative.

---

## 17. Contact

Pour toute question relative à la présente Politique :

- **Email :** support@mycashbill.app
- **Adresse :** DANY — MyCashBill, Douala, Cameroun
- **NIU :** P118816334425R
