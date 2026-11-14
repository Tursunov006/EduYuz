#!/usr/bin/env bash
# GitHub'dagi eng so'nggi kodni olib, backendni qayta build qilish.
# Ishlatish:  bash update.sh
set -euo pipefail
cd "$(dirname "$0")"
git -C .. pull --ff-only
sudo docker compose up -d --build
sudo docker image prune -f >/dev/null
sleep 20
curl -fsS http://127.0.0.1:3000/api/v1/health && echo && echo "Yangilandi."
