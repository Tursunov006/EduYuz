#!/usr/bin/env bash
# EduYuz uy serverini bir martalik sozlash (Ubuntu Server 24.04).
# Ishlatish:  bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> 1/5 Tizimni yangilash"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> 2/5 Docker o'rnatish"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi
sudo systemctl enable --now docker

echo "==> 3/5 Xavfsizlik: avtomatik xavfsizlik yangilanishlari va firewall"
sudo apt-get install -y unattended-upgrades ufw
sudo dpkg-reconfigure -f noninteractive unattended-upgrades
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "==> 4/5 Sozlamalar fayli"
if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env
  echo "!! .env yaratildi. Uni to'ldiring:  nano $(pwd)/.env   — so'ng skriptni qayta ishga tushiring."
  exit 0
fi
chmod 600 .env

echo "==> 5/5 Serverni ishga tushirish va tungi zaxirani yoqish"
sudo docker compose up -d --build
chmod +x backup.sh update.sh
( crontab -l 2>/dev/null | grep -v 'eduyuz-backup' ; echo "30 2 * * * $(pwd)/backup.sh >> $(pwd)/backup.log 2>&1 # eduyuz-backup" ) | crontab -

echo
echo "Tayyor! Tekshirish:  curl http://127.0.0.1:3000/api/v1/health"
