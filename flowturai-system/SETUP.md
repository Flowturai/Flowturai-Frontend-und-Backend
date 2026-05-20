# Flowturai System – Setup-Anleitung v2

## DSGVO-Status: Was ist konform, was nicht?

| Komponente | Status | Hinweis |
|---|---|---|
| Hetzner (Deutschland) | ✅ DSGVO-konform | Deutsches RZ, AV-Vertrag vorhanden |
| PostgreSQL auf Hetzner | ✅ DSGVO-konform | Daten verlassen nie Deutschland |
| IONOS E-Mail | ✅ DSGVO-konform | Deutsches Unternehmen |
| Automatische Backups | ✅ DSGVO-konform | Verbleiben auf Hetzner-Volume |
| **Claude API (Anthropic)** | ⚠️ **Aktion nötig** | US-Server – DPA unterschreiben + nur anonymisierte Daten senden |
| Tauri Desktop App | ✅ DSGVO-konform | Keine Cloud-Verbindung der App selbst |

### Claude API DSGVO-konform machen (wichtig!)
1. In der [Anthropic Console](https://console.anthropic.com) einloggen
2. Unter **Settings → Usage Policies** → Data Processing Agreement (DPA) herunterladen und unterschreiben
3. Das System sendet ohnehin nur anonymisierte Daten an Claude (Branche, kein Name/E-Mail) – bereits eingebaut

---

## Schritt 1 – Hetzner Server einrichten

```bash
# 1. Hetzner Cloud: https://console.hetzner.cloud
#    → Neues Projekt → Server erstellen
#    → Typ: CX22 (2 vCPU, 4 GB RAM, ~4 €/Monat)
#    → Standort: Nürnberg oder Falkenstein (Deutschland)
#    → OS: Ubuntu 22.04 LTS
#    → SSH-Key hinterlegen

# 2. Auf dem Server:
ssh root@DEINE_SERVER_IP

# Docker installieren
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git

# Projekt klonen / hochladen
git clone https://github.com/DEIN_GITHUB/flowturai-system.git
cd flowturai-system

# .env anlegen
cp .env.example .env
nano .env   # Alle Werte ausfüllen!
```

---

## Schritt 2 – SSL-Zertifikat (einmalig)

```bash
# DNS: A-Record deiner Domain auf die Server-IP zeigen lassen
# Dann:
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d flowturai.de -d www.flowturai.de \
  --email hallo@flowturai.de --agree-tos --non-interactive

# nginx.prod.conf: "DEINE_DOMAIN" durch flowturai.de ersetzen
sed -i 's/DEINE_DOMAIN/flowturai.de/g' nginx/nginx.prod.conf
```

---

## Schritt 3 – Production starten

```bash
# Alles starten (beim ersten Mal ~2 min)
docker compose up -d

# Status prüfen
docker compose ps

# Logs anschauen
docker compose logs -f api
```

✅ Das war's. Das System läuft jetzt und:
- Datenbank wird automatisch mit Schema initialisiert
- Backups laufen täglich um 03:00 Uhr
- Abos werden monatlich abgerechnet

---

## Schritt 4 – Staging-Umgebung starten

```bash
# Staging parallel zu Production starten
docker compose -f docker-compose.staging.yml up -d

# Staging ist dann erreichbar unter:
# http://DEINE_SERVER_IP:8080
# (oder staging.flowturai.de wenn DNS-Eintrag gesetzt)
```

**Workflow für Updates:**
1. Änderungen im Code vornehmen
2. Staging neu starten: `docker compose -f docker-compose.staging.yml up -d --build`
3. Im Browser testen: `http://staging.flowturai.de`
4. Wenn alles funktioniert → Production updaten:
   ```bash
   docker compose up -d --build
   ```

---

## Schritt 5 – Desktop App bauen

### Voraussetzungen
- [Rust](https://rustup.rs) installieren: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [Node.js 20+](https://nodejs.org) installieren

### Windows (.exe / .msi)
```bash
cd desktop
npm install
npm run build:windows
# Output: src-tauri/target/release/bundle/msi/Flowturai_2.0.0_x64.msi
```

### macOS (.dmg) – Apple Silicon
```bash
cd desktop
npm install
npm run build:mac
# Output: src-tauri/target/release/bundle/dmg/Flowturai_2.0.0_aarch64.dmg
```

### macOS (.dmg) – Intel Mac
```bash
npm run build:mac-intel
```

### iOS
Für iOS ist ein **Apple Developer Account** (99 €/Jahr) erforderlich.
Zusätzlich: Xcode auf einem Mac installieren.
```bash
# Xcode + iOS-Target installieren
rustup target add aarch64-apple-ios
npm run build  # erfordert Xcode-Einrichtung
```
→ Alternativ: Die Web-App auf dem iPhone als PWA nutzen
  (Safari → Teilen → Zum Home-Bildschirm) – funktioniert sofort ohne App Store.

---

## Schritt 6 – IONOS E-Mail konfigurieren

In der `.env` eintragen:
```
IONOS_EMAIL=hallo@flowturai.de
IONOS_PASSWORD=dein_ionos_passwort
IONOS_SMTP_HOST=smtp.ionos.de
IONOS_SMTP_PORT=587
```

In IONOS: **E-Mail → Einstellungen → SMTP** → Port 587 mit STARTTLS.

---

## Automatische Backups

Backups liegen auf dem Hetzner-Server unter `/var/lib/docker/volumes/flowturai-system_backups/`.

```bash
# Backup manuell auslösen (zum Testen)
docker compose exec api node -e "require('./src/cron/backup').dailyBackup()"

# Backups anzeigen
docker compose exec api ls -lh /backups/
```

Retention: 30 Tage. Ältere Backups werden automatisch gelöscht.
Bei Fehler: Sofortige E-Mail an dich.

---

## Häufige Befehle

```bash
# System stoppen
docker compose down

# Logs live anschauen
docker compose logs -f api

# Datenbank direkt abfragen
docker compose exec db psql -U flowturai flowturai

# Backup manuell
docker compose exec api node -e "require('./src/cron/backup').dailyBackup()"

# Abrechnung manuell testen
docker compose exec api node -e "require('./src/cron/billing').monthlyBilling()"
```

---

## Website einbinden (Kontaktformular)

```javascript
fetch('https://flowturai.de/api/book-consultation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name:     'Max Mustermann',
    email:    'max@musterbetrieb.de',
    phone:    '0151 12345678',
    company:  'Musterbetrieb GmbH',
    industry: 'Elektriker',
    message:  'Ich möchte meine Angebotserstellung automatisieren.'
  })
});
```
