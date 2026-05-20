#!/bin/bash
# ============================================================
# FLOWTURAI – Automatisches Deployment auf Hetzner (Ubuntu 24.04)
# Einmalig ausführen als root: bash deploy.sh
# ============================================================
set -e

echo ""
echo "========================================"
echo " Flowturai Deployment startet..."
echo "========================================"

# 1. System aktualisieren
apt-get update -q && apt-get upgrade -y -q

# 2. Docker installieren (falls nicht vorhanden)
if ! command -v docker &> /dev/null; then
  echo "[1/6] Docker installieren..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "[1/6] Docker bereits installiert."
fi

# 3. Git installieren
apt-get install -y git curl wget unzip -q

# 4. Projekt nach /opt/flowturai kopieren
echo "[2/6] Projekt einrichten..."
mkdir -p /opt/flowturai
cp -r . /opt/flowturai/
cd /opt/flowturai

# 5. .env pruefen
if [ ! -f .env ]; then
  echo "FEHLER: .env Datei fehlt! Bitte zuerst .env anlegen."
  exit 1
fi
echo "[3/6] .env gefunden."

# 6. Firewall
echo "[4/6] Firewall konfigurieren..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# 7. Docker Image bauen und starten
echo "[5/6] Docker Container bauen und starten..."
docker compose -f docker-compose.prod.yml pull traefik 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --build

# 8. Warten und Status pruefen
echo "[6/6] Warte auf Start..."
sleep 15
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
echo " Flowturai erfolgreich deployed!"
echo " Dashboard: https://$(grep DOMAIN .env | cut -d= -f2)"
echo "========================================"
