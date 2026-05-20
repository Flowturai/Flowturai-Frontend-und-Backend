# ============================================================
#  Flowturai - Deployment Script v5
#  Deployt Backend + Frontend auf den Produktionsserver
#
#  cd C:\Users\User\Documents\Flowturai\Flowturai\flowturai-system
#  .\deploy.ps1
# ============================================================

$SERVER        = "root@178.105.138.200"
$REMOTE        = "/opt/flowturai/flowturai-system"
$LOCAL         = Split-Path -Parent $MyInvocation.MyCommand.Path
$FRONTEND_SRC  = Join-Path (Split-Path $LOCAL -Parent) "Frontend Flowturai"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Flowturai Deployment v5" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── 1. Backend-Dateien hochladen ──────────────────────────────
Write-Host "`n[1/5] Backend-Dateien hochladen..." -ForegroundColor Yellow

$files = @(
  @{ src="backend\src\lib\email.js";            dst="backend/src/lib/email.js" },
  @{ src="backend\src\lib\ai.js";              dst="backend/src/lib/ai.js" },
  @{ src="backend\src\lib\pdf.js";             dst="backend/src/lib/pdf.js" },
  @{ src="backend\src\lib\offer-pdf.js";       dst="backend/src/lib/offer-pdf.js" },
  @{ src="backend\src\lib\contract-pdf.js";    dst="backend/src/lib/contract-pdf.js" },
  @{ src="backend\src\lib\whatsapp.js";        dst="backend/src/lib/whatsapp.js" },
  @{ src="backend\src\routes\contracts.js";    dst="backend/src/routes/contracts.js" },
  @{ src="backend\src\routes\invoice.js";      dst="backend/src/routes/invoice.js" },
  @{ src="backend\src\routes\offers.js";       dst="backend/src/routes/offers.js" },
  @{ src="backend\src\routes\stage.js";        dst="backend/src/routes/stage.js" },
  @{ src="backend\src\routes\consultation.js";  dst="backend/src/routes/consultation.js" },
  @{ src="backend\src\routes\appointments.js"; dst="backend/src/routes/appointments.js" },
  @{ src="backend\src\lib\dunning-pdf.js";     dst="backend/src/lib/dunning-pdf.js" },
  @{ src="backend\src\routes\inbox.js";        dst="backend/src/routes/inbox.js" },
  @{ src="backend\src\cron\inbox.js";          dst="backend/src/cron/inbox.js" },
  @{ src="backend\src\index.js";               dst="backend/src/index.js" },
  @{ src="backend\package.json";               dst="backend/package.json" },
  @{ src="admin\index.html";                   dst="admin/index.html" },
  @{ src="docker-compose.prod.yml";            dst="docker-compose.prod.yml" },
  @{ src="migration.sql";                      dst="migration.sql" },
  @{ src="run-migration.js";                   dst="run-migration.js" }
)

foreach ($f in $files) {
  $src = Join-Path $LOCAL $f.src
  $dst = "${SERVER}:${REMOTE}/$($f.dst)"
  Write-Host "  -> $($f.dst)" -ForegroundColor Gray
  scp -q -o StrictHostKeyChecking=no $src $dst
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  FEHLER bei $($f.src)" -ForegroundColor Red
    exit 1
  }
}
Write-Host "  OK: Backend-Dateien uebertragen" -ForegroundColor Green

# ── 2. Frontend hochladen (ohne node_modules / .next) ────────
Write-Host "`n[2/5] Frontend hochladen..." -ForegroundColor Yellow

$ARCHIVE = "$env:TEMP\flowturai-frontend.tar.gz"

# Archiv via Git Bash erstellen (Windows tar versteht --exclude nicht korrekt)
$BASH = "C:\Program Files\Git\bin\bash.exe"
$frontendBash = $FRONTEND_SRC.Replace('\','/').Replace('C:','/c')
$archiveBash  = $ARCHIVE.Replace('\','/').Replace('C:','/c')
& $BASH -c "cd '$frontendBash' && tar -czf '$archiveBash' --exclude=./node_modules --exclude=./.next --exclude=./.git --exclude=./.env ."

if ($LASTEXITCODE -ne 0) {
  Write-Host "  FEHLER: Frontend-Archiv konnte nicht erstellt werden" -ForegroundColor Red
  exit 1
}

# Archiv hochladen und auf dem Server entpacken
Write-Host "  -> Frontend archiv hochladen (~$(([System.IO.FileInfo]$ARCHIVE).Length / 1MB | % { [math]::Round($_, 1) }) MB)" -ForegroundColor Gray
scp -q -o StrictHostKeyChecking=no $ARCHIVE "${SERVER}:/tmp/flowturai-frontend.tar.gz"
ssh -o StrictHostKeyChecking=no $SERVER "mkdir -p ${REMOTE}/frontend && tar -xzf /tmp/flowturai-frontend.tar.gz -C ${REMOTE}/frontend && rm /tmp/flowturai-frontend.tar.gz"

if ($LASTEXITCODE -ne 0) {
  Write-Host "  FEHLER: Frontend-Upload fehlgeschlagen" -ForegroundColor Red
  exit 1
}

Remove-Item $ARCHIVE -Force
Write-Host "  OK: Frontend hochgeladen" -ForegroundColor Green

# ── 3. Backend: Migration + Rebuild ──────────────────────────
Write-Host "`n[3/5] Backend Migration + Container bauen..." -ForegroundColor Yellow

$backendCmd  = "set -e; "
$backendCmd += "docker cp $REMOTE/migration.sql flowturai_api:/app/migration.sql 2>/dev/null || true; "
$backendCmd += "docker cp $REMOTE/run-migration.js flowturai_api:/app/run-migration.js 2>/dev/null || true; "
$backendCmd += "docker exec -w /app flowturai_api node /app/run-migration.js 2>/dev/null || true; "
$backendCmd += "cd $REMOTE && docker compose -f docker-compose.prod.yml build --no-cache api; "
$backendCmd += "docker compose -f docker-compose.prod.yml up -d api"

ssh -o StrictHostKeyChecking=no $SERVER $backendCmd
if ($LASTEXITCODE -ne 0) {
  Write-Host "  FEHLER: Backend-Build fehlgeschlagen" -ForegroundColor Red
  exit 1
}
Write-Host "  OK: Backend gestartet" -ForegroundColor Green

# ── 4. Frontend: Build + Start ────────────────────────────────
Write-Host "`n[4/5] Frontend bauen und starten (dauert ca. 2-3 Min.)..." -ForegroundColor Yellow

$frontendCmd  = "set -e; "
$frontendCmd += "cd $REMOTE && "
$frontendCmd += "docker compose -f docker-compose.prod.yml build --no-cache frontend && "
$frontendCmd += "docker compose -f docker-compose.prod.yml up -d frontend && "
$frontendCmd += "docker ps --filter 'name=flowturai' --format 'table {{.Names}}\t{{.Status}}'"

ssh -o StrictHostKeyChecking=no $SERVER $frontendCmd
if ($LASTEXITCODE -ne 0) {
  Write-Host "  FEHLER: Frontend-Build fehlgeschlagen" -ForegroundColor Red
  Write-Host "  Logs: ssh $SERVER docker logs flowturai_frontend --tail 30" -ForegroundColor Gray
  exit 1
}
Write-Host "  OK: Frontend gestartet" -ForegroundColor Green

# ── 5. Health-Checks ──────────────────────────────────────────
Write-Host "`n[5/5] Health-Checks (warte 15 Sekunden)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Backend
try {
  $r = Invoke-WebRequest -Uri "https://flowturai.de/api/health" -TimeoutSec 15 -ErrorAction Stop
  Write-Host "  OK: Backend antwortet ($($r.StatusCode))" -ForegroundColor Green
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 401 -or $code -eq 403) {
    Write-Host "  OK: Backend laeuft (Auth aktiv, $code)" -ForegroundColor Green
  } else {
    Write-Host "  WARNUNG Backend: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

# Frontend
try {
  $r2 = Invoke-WebRequest -Uri "https://www.flowturai.de" -TimeoutSec 20 -ErrorAction Stop
  Write-Host "  OK: Frontend antwortet ($($r2.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "  WARNUNG Frontend: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "  Logs: ssh $SERVER docker logs flowturai_frontend --tail 30" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deployment abgeschlossen!" -ForegroundColor Green
Write-Host " Backend:  https://flowturai.de" -ForegroundColor White
Write-Host " Frontend: https://www.flowturai.de" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
