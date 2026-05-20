# Flowturai – Deployment Instructions for Claude Code

## Ziel
Deploye das Flowturai-Projekt (Backend + Frontend) auf den Produktionsserver.

---

## Server-Zugang

| | |
|---|---|
| **IP** | `178.105.138.200` |
| **User** | `root` |
| **Passwort** | `20Kilian22!!` |
| **SSH-Port** | `22` |
| **Remote-Pfad** | `/opt/flowturai/flowturai-system` |

Verbindung testen:
```bash
ssh root@178.105.138.200
# Passwort: 20Kilian22!!
```

---

## Lokale Projektstruktur

```
C:\Users\User\Documents\Flowturai\Flowturai\
├── flowturai-system\          ← Backend + Docker Compose + Deploy-Skript
│   ├── backend\
│   │   ├── src\
│   │   │   ├── index.js
│   │   │   ├── lib\           (email.js, ai.js, pdf.js, offer-pdf.js, contract-pdf.js, whatsapp.js)
│   │   │   ├── routes\        (contracts.js, invoice.js, offers.js, stage.js, consultation.js, inbox.js)
│   │   │   └── cron\          (inbox.js)
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── admin\
│   │   └── index.html
│   ├── docker-compose.prod.yml
│   ├── migration.sql
│   ├── run-migration.js
│   └── deploy.ps1             ← Deployment-Skript (Windows PowerShell)
│
└── Frontend Flowturai\        ← Next.js 15 Frontend
    ├── app\
    ├── components\
    ├── lib\
    ├── public\
    ├── next.config.ts
    ├── package.json
    ├── Dockerfile
    └── .dockerignore
```

---

## Was das Deployment macht

### Schritt 1 – Backend-Dateien hochladen
Per `scp` werden folgende Dateien auf den Server kopiert (nach `/opt/flowturai/flowturai-system/`):

```
backend/src/lib/email.js
backend/src/lib/ai.js
backend/src/lib/pdf.js
backend/src/lib/offer-pdf.js
backend/src/lib/contract-pdf.js
backend/src/lib/whatsapp.js
backend/src/routes/contracts.js
backend/src/routes/invoice.js
backend/src/routes/offers.js
backend/src/routes/stage.js
backend/src/routes/consultation.js
backend/src/routes/inbox.js
backend/src/cron/inbox.js
backend/src/index.js
backend/package.json
admin/index.html
docker-compose.prod.yml
migration.sql
run-migration.js
```

### Schritt 2 – Frontend hochladen
Das gesamte `Frontend Flowturai\` Verzeichnis wird als `.tar.gz` Archiv gepackt
(ohne `node_modules`, `.next`, `.git`, `.env`) und auf den Server hochgeladen:

```bash
# Lokal packen:
tar -czf /tmp/flowturai-frontend.tar.gz -C "Frontend Flowturai" . \
  --exclude=./node_modules \
  --exclude=./.next \
  --exclude=./.git \
  --exclude=./.env

# Auf Server hochladen:
scp /tmp/flowturai-frontend.tar.gz root@178.105.138.200:/tmp/

# Auf Server entpacken:
ssh root@178.105.138.200 "mkdir -p /opt/flowturai/flowturai-system/frontend && tar -xzf /tmp/flowturai-frontend.tar.gz -C /opt/flowturai/flowturai-system/frontend && rm /tmp/flowturai-frontend.tar.gz"
```

### Schritt 3 – Backend bauen & starten
```bash
ssh root@178.105.138.200 "
  cd /opt/flowturai/flowturai-system
  docker compose -f docker-compose.prod.yml build --no-cache api
  docker compose -f docker-compose.prod.yml up -d api
"
```

### Schritt 4 – Frontend bauen & starten (~2-3 Minuten)
```bash
ssh root@178.105.138.200 "
  cd /opt/flowturai/flowturai-system
  docker compose -f docker-compose.prod.yml build --no-cache frontend
  docker compose -f docker-compose.prod.yml up -d frontend
"
```

### Schritt 5 – Health-Checks
```bash
curl -s -o /dev/null -w "%{http_code}" https://flowturai.de/api/health
curl -s -o /dev/null -w "%{http_code}" https://www.flowturai.de
curl -s -o /dev/null -w "%{http_code}" https://flowturai.de/admin
```
Alle drei sollten 200 (oder 401/403 beim API-Health) zurückgeben.

---

## Architektur auf dem Server

```
Internet
   │
   ▼
Traefik (Port 80/443, SSL via Let's Encrypt)
   ├── flowturai.de/admin  → flowturai_api  (Port 3000, /admin wird weggestripped)
   ├── flowturai.de        → flowturai_frontend (Port 3001)
   └── www.flowturai.de    → flowturai_frontend (Port 3001)

flowturai_frontend (Next.js)
   └── /api/* Requests → intern weitergeleitet an flowturai_api:3000
```

---

## Wichtige Hinweise

- **Die `.env` auf dem Server wird NICHT überschrieben** – sie liegt unter `/opt/flowturai/flowturai-system/.env` und enthält alle Secrets
- **Windows-Truncation-Bug**: Beim Hochladen von Dateien über SFTP aus Windows-Mounts können Dateien abgeschnitten werden. Deshalb Dateien immer als tar-Archiv oder direkt über Python/paramiko mit `sftp.open(..., 'wb').write(bytes)` schreiben
- **Frontend-Build dauert ~2-3 Minuten** – bitte warten bis er fertig ist
- **SSH StrictHostKeyChecking**: Beim ersten Mal mit `yes` bestätigen oder `-o StrictHostKeyChecking=no` verwenden

---

## Falls du Python/paramiko verwendest (empfohlen für Claude Code)

```python
import paramiko

HOST = "178.105.138.200"
USER = "root"
PASS = "20Kilian22!!"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

# Datei schreiben (truncation-sicher):
sftp = ssh.open_sftp()
with sftp.open("/remote/path/file.txt", "wb") as f:
    f.write(b"file content as bytes")
sftp.close()

# Befehl ausführen:
stdin, stdout, stderr = ssh.exec_command("docker ps")
print(stdout.read().decode())
ssh.close()
```

---

## URLs nach erfolgreichem Deployment

| URL | Was |
|-----|-----|
| `https://www.flowturai.de` | Next.js Frontend (Kundenwebsite) |
| `https://flowturai.de` | Ebenfalls Frontend |
| `https://flowturai.de/admin` | Backend Admin-Dashboard (versteckt) |
| `https://flowturai.de/api/health` | Backend Health-Check |
