#!/usr/bin/env bash
# Usage: ./scripts/set-domain.sh mycashbill.app newdomain.tld
set -euo pipefail

OLD_DOMAIN="${1:-}"
NEW_DOMAIN="${2:-}"

if [ -z "$OLD_DOMAIN" ] || [ -z "$NEW_DOMAIN" ]; then
  echo "Usage: $0 <OLD_DOMAIN> <NEW_DOMAIN>"
  echo "Exemple: $0 mycashbill.app mycashbill.cm"
  exit 1
fi

if [ "$OLD_DOMAIN" = "$NEW_DOMAIN" ]; then
  echo "❌ OLD_DOMAIN = NEW_DOMAIN"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Bascule domaine : $OLD_DOMAIN → $NEW_DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Ce script NE MODIFIE PAS :"
echo "    - .env.production (à éditer manuellement pour préserver les secrets)"
echo "    - .env.local (à éditer manuellement)"
echo "    - prisma/migrations (ne pas toucher)"
echo ""
read -p "Continuer ? [y/N] " confirm
if [ "$confirm" != "y" ]; then echo "Annulé."; exit 1; fi

echo ""
echo "Fichiers à modifier (aperçu) :"
grep -rl "$OLD_DOMAIN" \
  --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" \
  --include="*.yml" --include="*.yaml" --include="*.example" --include="Caddyfile" \
  . 2>/dev/null | grep -v node_modules | grep -v ".next/" | grep -v "prisma/migrations/" | grep -v ".env.production" | grep -v ".env.local" || true

echo ""
read -p "Appliquer les remplacements ? [y/N] " confirm2
if [ "$confirm2" != "y" ]; then echo "Annulé."; exit 1; fi

# Remplacement par fichier (sed BSD/GNU compatible)
grep -rl "$OLD_DOMAIN" \
  --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" \
  --include="*.yml" --include="*.yaml" --include="*.example" --include="Caddyfile" \
  . 2>/dev/null | grep -v node_modules | grep -v ".next/" | grep -v "prisma/migrations/" | grep -v ".env.production" | grep -v ".env.local" | while IFS= read -r file; do
  sed -i "s|${OLD_DOMAIN}|${NEW_DOMAIN}|g" "$file"
  echo "  ✏️  $file"
done

echo ""
echo "✅ Remplacements appliqués dans les fichiers listés."
echo ""
echo "⚠️  ACTIONS MANUELLES RESTANTES :"
echo "  1. Éditer .env.production : remplacer $OLD_DOMAIN par $NEW_DOMAIN dans APP_URL et NEXT_PUBLIC_APP_URL"
echo "  2. Sur le VPS : mettre à jour /etc/caddy/Caddyfile (remplacer $OLD_DOMAIN par $NEW_DOMAIN)"
echo "  3. Sur le VPS : systemctl restart caddy"
echo "  4. Sur le VPS : pm2 restart mycashbill --update-env"
echo "  5. DNS : pointer $NEW_DOMAIN vers l'IP du VPS (attendre propagation, dig +short $NEW_DOMAIN)"
echo "  6. UptimeRobot : mettre à jour l'URL du monitor"
echo ""
echo "  7. Vérifier : grep -r '$OLD_DOMAIN' --include='*.ts' --include='*.tsx' --include='*.json' . | grep -v node_modules | grep -v .next/ | grep -v prisma/migrations/ | wc -l"
echo "     doit retourner 0"
