#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
FAILURES=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if [ "$expected" = "$actual" ]; then
    echo "✅ $name → $actual"
  else
    echo "❌ $name → attendu $expected, reçu $actual"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "═══════════════════════════════════════════════════════════"
echo "AUDIT SÉCURITÉ CASHBILL"
echo "═══════════════════════════════════════════════════════════"

# 1. CSRF : mutation sans X-Requested-With → 403
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"699000000","pin":"123456","deviceId":"x","locale":"FR"}')
check "CSRF sans header" "403" "$status"

# 2. Rate limit login : 11 tentatives → la 11e = 429
for i in $(seq 1 10); do
  curl -s -o /dev/null -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" -H "X-Requested-With: fetch" \
    -d '{"phone":"699000099","pin":"999999","deviceId":"x"}'
done
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" -H "X-Requested-With: fetch" \
  -d '{"phone":"699000099","pin":"999999","deviceId":"x"}')
check "Rate limit login" "429" "$status"

# 3. Headers sécurité
headers=$(curl -s -I "$BASE_URL/fr")
check "X-Frame-Options" "DENY" "$(echo "$headers" | grep -i '^x-frame-options:' | awk '{print $2}' | tr -d '\r')"
check "X-Content-Type-Options" "nosniff" "$(echo "$headers" | grep -i '^x-content-type-options:' | awk '{print $2}' | tr -d '\r')"
csp=$(echo "$headers" | grep -i '^content-security-policy:' | head -1)
if echo "$csp" | grep -q "default-src 'self'"; then
  echo "✅ Content-Security-Policy présent"
else
  echo "❌ Content-Security-Policy manquant ou invalide"
  FAILURES=$((FAILURES + 1))
fi

# 4. Auth bypass : /api/auth/me sans cookie → 401
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/me")
check "Auth bypass /api/auth/me" "401" "$status"

# 5. Auth bypass : /api/admin/users sans cookie → 401
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/users")
check "Auth bypass /api/admin/users" "401" "$status"

# 6. Webhook signature invalide → 401
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/notchpay" \
  -H "Content-Type: application/json" -H "X-Notchpay-Signature: invalid" \
  -d '{"event":"payment.complete","data":{"reference":"x"}}')
check "Webhook signature invalide" "401" "$status"

# 7. Directory traversal uploads
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/uploads/..%2F..%2Fetc%2Fpasswd")
check "Directory traversal uploads" "401" "$status"

# 8. Health endpoint
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
check "Health check" "200" "$status"

echo "═══════════════════════════════════════════════════════════"
if [ $FAILURES -eq 0 ]; then
  echo "✅ AUDIT SÉCURITÉ : TOUS LES TESTS PASSENT"
  exit 0
else
  echo "❌ AUDIT SÉCURITÉ : $FAILURES ÉCHEC(S)"
  exit 1
fi

