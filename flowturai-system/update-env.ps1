# ============================================================
#  Flowturai - .env auf Server aktualisieren
#  Voraussetzung: setup-ssh-key.ps1 einmalig ausgefuehrt
#
#  cd C:\Users\User\Documents\Flowturai\Flowturai\flowturai-system
#  .\update-env.ps1
# ============================================================

$SERVER = "root@178.105.138.200"
$REMOTE = "/opt/flowturai/flowturai-system"
$LOCAL  = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Flowturai .env Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# .env hochladen
Write-Host "`n[1/2] .env hochladen..." -ForegroundColor Yellow
scp -q -o StrictHostKeyChecking=no "$LOCAL\.env" "${SERVER}:${REMOTE}/.env"
if ($LASTEXITCODE -ne 0) {
  Write-Host "  FEHLER beim Upload" -ForegroundColor Red
  exit 1
}
Write-Host "  OK: .env uebertragen" -ForegroundColor Green

# Container neu starten (kein rebuild noetig, nur neue Env-Vars einlesen)
Write-Host "`n[2/2] Container neu starten..." -ForegroundColor Yellow
$cmd = "cd $REMOTE && docker compose -f docker-compose.prod.yml up -d api"
ssh -o StrictHostKeyChecking=no $SERVER $cmd
if ($LASTEXITCODE -ne 0) {
  Write-Host "  FEHLER beim Neustart" -ForegroundColor Red
  exit 1
}
Write-Host "  OK: Container gestartet" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " .env erfolgreich aktualisiert!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Hinweis: Twilio WhatsApp-Nummer noch setzen:" -ForegroundColor Yellow
Write-Host "  TWILIO_WHATSAPP_TO=whatsapp:+49DEINENUMMER" -ForegroundColor Gray
Write-Host "Dann erneut .\update-env.ps1 ausfuehren." -ForegroundColor Gray
Write-Host ""
