# ============================================================
#  Flowturai - SSH Key Setup (einmalig ausfuehren)
#  Danach: deploy.ps1 ohne Passwort-Abfragen
# ============================================================

$SERVER  = "root@178.105.138.200"
$keyPath = "$env:USERPROFILE\.ssh\id_ed25519"

if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
  New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" | Out-Null
}

if (-not (Test-Path $keyPath)) {
  Write-Host "Generiere SSH-Key (2x Enter druecken fuer keine Passphrase)..." -ForegroundColor Yellow
  & ssh-keygen -t ed25519 -f $keyPath -C "flowturai-deploy"
} else {
  Write-Host "SSH-Key bereits vorhanden: $keyPath" -ForegroundColor Green
}

if (-not (Test-Path "$keyPath.pub")) {
  Write-Host "FEHLER: Key-Datei nicht gefunden. Bitte manuell ausfuehren:" -ForegroundColor Red
  Write-Host "  ssh-keygen -t ed25519 -f $keyPath" -ForegroundColor Gray
  exit 1
}

Write-Host ""
Write-Host "Kopiere Key auf Server - EINMALIG Passwort eingeben:" -ForegroundColor Yellow
$pubKey = (Get-Content "$keyPath.pub").Trim()
ssh $SERVER "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo 'SSH-Key erfolgreich eingerichtet'"

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Green
  Write-Host " Fertig! Ab jetzt kein Passwort mehr." -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
} else {
  Write-Host "Fehler. Manuell pruefen." -ForegroundColor Red
}
