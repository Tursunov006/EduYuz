#!/usr/bin/env bash
# Bazaning tungi zaxirasi (har kecha 02:30 da cron orqali). Oxirgi 14 kunlik nusxa saqlanadi.
# Qo'lda ishlatish:  bash backup.sh
set -euo pipefail
cd "$(dirname "$0")"
DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')
mkdir -p backups
FILE="backups/eduyuz-$(date +%Y-%m-%d_%H%M).sql.gz"
# Supabase pooler (6543) pg_dump bilan ishlamaydi — 5432 (session) portiga almashtiramiz,
# "?pgbouncer=true" kabi qo'shimcha parametrlar olib tashlanadi.
URL="${DATABASE_URL%%\?*}"
URL="${URL/:6543\//:5432/}"
# pg_dump Docker ichida (17-versiya Supabase'ning 15/16/17 bazalari bilan mos)
sudo docker run --rm --quiet -e PGURL="$URL" postgres:17-alpine sh -c 'pg_dump "$PGURL" --no-owner --no-privileges' | gzip > "$FILE"
[ -s "$FILE" ] && [ "$(gzip -cd "$FILE" | head -c 100 | wc -c)" -gt 0 ] || { echo "ZAXIRA XATO: fayl bo'sh"; rm -f "$FILE"; exit 1; }
find backups -name 'eduyuz-*.sql.gz' -mtime +14 -delete
echo "$(date '+%F %T') zaxira: $FILE ($(du -h "$FILE" | cut -f1))"
