# Déploiement MyCashBill

## Prérequis
- VPS Contabo Ubuntu 22.04
- Domaine avec A record → IP VPS
- Repo GitHub avec secrets configurés

## Architecture
- **Caddy** : reverse proxy SSL (port 443 → 3000)
- **PM2** : process manager Node
- **PostgreSQL 16** : local (127.0.0.1:5432)
- **Node 20** : via apt, pnpm via corepack
- **Utilisateur** : `deploy` (non-root, SSH clé uniquement)
- **App** : `/var/www/mycashbill`

## Variables d'env
`/var/www/mycashbill/.env.production` (chmod 600, owner deploy)

## Déploiement automatique
Push sur `main` → GitHub Actions → CI (tests) → SSH deploy → `pm2 reload`.

## Déploiement manuel
```bash
ssh deploy@SERVER_IP
cd /var/www/mycashbill
git pull origin main
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 reload mycashbill
```

## Rollback
```bash
git reset --hard HEAD~1
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 reload mycashbill
```

## Scripts CLI SSH (actions critiques)
Tous exécutés sur le VPS, jamais via l'API.

```bash
pnpm cli:create-admin "+237XXXXXXXXX" "123456" "Nom"
pnpm cli:export-user "+237XXXXXXXXX" "réquisition judiciaire"
pnpm cli:modify-threshold "MAX_DOCS_PER_24H" 500 "test"
pnpm cli:remove-blacklist "PHONE" "+237XXXXXXXXX" "faux positif"
pnpm cli:migrate-uploads
```

### Migration chiffrement des uploads au repos (AES-256-GCM)
Procédure à exécuter lors du déploiement :
1. **Backup** `/var/www/mycashbill/uploads/` :
   ```bash
   cp -r /var/www/mycashbill/uploads /var/backups/mycashbill/uploads_pre_encryption_$(date +%Y%m%d_%H%M%S)
   ```
2. **Vérifier** la présence de `UPLOAD_ENCRYPTION_KEY` (64 caractères hex) dans `/var/www/mycashbill/.env.production`.
3. **Exécuter la migration** :
   ```bash
   pnpm cli:migrate-uploads
   ```
4. **Redémarrer le service PM2** :
   ```bash
   pm2 restart mycashbill --update-env
   ```
5. **Vérifier** que les logos et signatures s'affichent toujours correctement.

## Logs
- App : `/var/log/mycashbill/{out,error}.log`
- Caddy : `/var/log/caddy/*.log`
- Backups : `/var/log/mycashbill/backup.log`

## Backups
- PostgreSQL : `/var/backups/mycashbill/*.dump` (quotidien 3h, rotation 7j)

Restauration :
```bash
sudo -u postgres pg_restore -d mycashbill -c /var/backups/mycashbill/mycashbill_YYYYMMDD_HHMMSS.dump
```

## Monitoring
- UptimeRobot : `https://${DOMAIN}/api/health` (5 min)
- PM2 healthcheck : cron 5 min
- Logs : `pm2 logs mycashbill`

## Crontab
```bash
# Récurrent — toutes les 15 min
*/15 * * * * /usr/bin/curl -fsS -X POST https://mycashbill.app/api/cron/recurring -H "X-Cron-Secret: $(grep CRON_SECRET /var/www/mycashbill/.env.production | cut -d= -f2 | tr -d '\"')" >> /var/log/mycashbill/cron.log 2>&1

# Purge automatique — tous les jours à 4h du matin (heure Douala)
0 4 * * * /usr/bin/curl -fsS -X POST https://mycashbill.app/api/cron/cleanup -H "X-Cron-Secret: $(grep CRON_SECRET /var/www/mycashbill/.env.production | cut -d= -f2 | tr -d '\"')" >> /var/log/mycashbill/cleanup.log 2>&1
```

## Sécurité
- SSH : clé uniquement, root désactivé
- Firewall : 22, 80, 443 uniquement
- Fail2ban : SSH (5 tentatives → 1h ban)
- Headers : CSP, HSTS, X-Frame, X-Content-Type
- Secrets : `.env.production` (chmod 600), GitHub Secrets pour CI
- Audit log immuable (trigger DB)
- Actions critiques : SSH only (4 scripts CLI)

