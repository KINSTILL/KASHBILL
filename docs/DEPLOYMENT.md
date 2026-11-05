# Déploiement CashBill

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
- **App** : `/var/www/cashbill`

## Variables d'env
`/var/www/cashbill/.env.production` (chmod 600, owner deploy)

## Déploiement automatique
Push sur `main` → GitHub Actions → CI (tests) → SSH deploy → `pm2 reload`.

## Déploiement manuel
```bash
ssh deploy@SERVER_IP
cd /var/www/cashbill
git pull origin main
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 reload cashbill
```

## Rollback
```bash
git reset --hard HEAD~1
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 reload cashbill
```

## Scripts CLI SSH (actions critiques)
Tous exécutés sur le VPS, jamais via l'API.

```bash
pnpm cli:create-admin "+237XXXXXXXXX" "123456" "Nom"
pnpm cli:export-user "+237XXXXXXXXX" "réquisition judiciaire"
pnpm cli:modify-threshold "MAX_DOCS_PER_24H" 500 "test"
pnpm cli:remove-blacklist "PHONE" "+237XXXXXXXXX" "faux positif"
```

## Logs
- App : `/var/log/cashbill/{out,error}.log`
- Caddy : `/var/log/caddy/*.log`
- Backups : `/var/log/cashbill/backup.log`

## Backups
- PostgreSQL : `/var/backups/cashbill/*.dump` (quotidien 3h, rotation 7j)

Restauration :
```bash
sudo -u postgres pg_restore -d cashbill -c /var/backups/cashbill/cashbill_YYYYMMDD_HHMMSS.dump
```

## Monitoring
- UptimeRobot : `https://${DOMAIN}/api/health` (5 min)
- PM2 healthcheck : cron 5 min
- Logs : `pm2 logs cashbill`

## Sécurité
- SSH : clé uniquement, root désactivé
- Firewall : 22, 80, 443 uniquement
- Fail2ban : SSH (5 tentatives → 1h ban)
- Headers : CSP, HSTS, X-Frame, X-Content-Type
- Secrets : `.env.production` (chmod 600), GitHub Secrets pour CI
- Audit log immuable (trigger DB)
- Actions critiques : SSH only (4 scripts CLI)

