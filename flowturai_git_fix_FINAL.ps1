# ============================================================
# Flowturai – Git-Komplettreparatur
# Einfach per Rechtsklick -> "Mit PowerShell ausführen" starten
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot  = "C:\Users\User\Desktop\Workspace\.claude\Flowturai Frontend und Backend"
$frontendDir  = Join-Path $projectRoot "Frontend Flowturai"
$backendDir   = Join-Path $projectRoot "flowturai-system"
$remoteUrl    = "https://github.com/Flowturai/Flowturai-Frontend-und-Backend.git"

# ---- .gitignore Inhalte ----
$rootGitignore = @"
# ===== Abhängigkeiten =====
node_modules/
.pnp
.pnp.js

# ===== Build-Ausgaben =====
.next/
out/
dist/
build/

# ===== Umgebungsvariablen (NIEMALS committen!) =====
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# ===== SSH / Server Keys (NIEMALS committen!) =====
flowturai_server_key
flowturai_server_key.pub
*.pem
*.key

# ===== Logs =====
npm-debug.log*
yarn-debug.log*
*.log
logs/

# ===== Editor / OS =====
.DS_Store
Thumbs.db
.vscode/
.idea/

# ===== TypeScript =====
*.tsbuildinfo
next-env.d.ts

# ===== Sonstiges =====
.agents/
"@

$frontendGitignore = @"
# Abhängigkeiten
node_modules/
.pnp
.pnp.js

# Build-Ausgaben
.next/
out/
dist/
build/

# Umgebungsvariablen
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
*.log

# Editor / OS
.DS_Store
Thumbs.db
.vscode/
.idea/

# TypeScript
*.tsbuildinfo
next-env.d.ts
"@

$backendGitignore = @"
# Abhängigkeiten
node_modules/

# Umgebungsvariablen (NIEMALS committen!)
.env
.env.local
.env.production

# Logs
*.log
logs/

# Editor / OS
.DS_Store
Thumbs.db
.vscode/
.idea/

# Build-Ausgaben
dist/
build/
"@

function Write-Step {
    param([string]$msg)
    Write-Host ""
    Write-Host ">>> $msg" -ForegroundColor Cyan
}

function Remove-GitDir {
    param([string]$dir)
    $gitPath = Join-Path $dir ".git"
    if (Test-Path $gitPath) {
        Write-Host "  Loesche .git in: $dir" -ForegroundColor Yellow
        # Entferne readonly-Attribute zuerst
        Get-ChildItem -Path $gitPath -Recurse -Force | ForEach-Object {
            $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
        }
        Remove-Item -Recurse -Force $gitPath
        Write-Host "  .git geloescht." -ForegroundColor Green
    } else {
        Write-Host "  Kein .git in: $dir" -ForegroundColor DarkGray
    }
}

# ============================================================
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Flowturai Git-Reparatur startet..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# SCHRITT 1: .git Ordner löschen
Write-Step "Schritt 1/5: Alte .git-Ordner loeschen"
Remove-GitDir -dir $projectRoot
Remove-GitDir -dir $frontendDir
Remove-GitDir -dir $backendDir

# SCHRITT 2: Falsch benannte .gitignore.txt entfernen
Write-Step "Schritt 2/5: Alte .gitignore.txt entfernen (falls vorhanden)"
foreach ($dir in @($projectRoot, $frontendDir, $backendDir)) {
    $wrong = Join-Path $dir ".gitignore.txt"
    if (Test-Path $wrong) {
        Remove-Item -Force $wrong
        Write-Host "  Entfernt: $wrong" -ForegroundColor Yellow
    }
}

# SCHRITT 3: Korrekte .gitignore Dateien anlegen
Write-Step "Schritt 3/5: .gitignore Dateien anlegen"
Set-Content -Path (Join-Path $projectRoot  ".gitignore") -Value $rootGitignore     -Encoding UTF8
Set-Content -Path (Join-Path $frontendDir  ".gitignore") -Value $frontendGitignore -Encoding UTF8
Set-Content -Path (Join-Path $backendDir   ".gitignore") -Value $backendGitignore  -Encoding UTF8
Write-Host "  .gitignore Dateien erstellt." -ForegroundColor Green

# SCHRITT 4: Git-Repository neu initialisieren
Write-Step "Schritt 4/5: Neues Git-Repository anlegen und committen"
Set-Location $projectRoot
git init
git config user.email "jungjeremy28@gmail.com"
git config user.name "Flowturai"
git add .
git status
git commit -m "Initial commit - Flowturai Frontend und Backend"

# SCHRITT 5: Remote setzen und pushen
Write-Step "Schritt 5/5: Remote setzen und pushen"
git remote add origin $remoteUrl
git branch -M main

Write-Host ""
Write-Host "  WICHTIG: Du musst jetzt zuerst das alte GitHub-Repo loeschen!" -ForegroundColor Red
Write-Host "  1. Gehe auf: https://github.com/Flowturai/Flowturai-Frontend-und-Backend/settings" -ForegroundColor Yellow
Write-Host "  2. Scrolle ganz nach unten -> 'Delete this repository'" -ForegroundColor Yellow
Write-Host "  3. Neues leeres Repo mit dem gleichen Namen anlegen:" -ForegroundColor Yellow
Write-Host "     https://github.com/new" -ForegroundColor Yellow
Write-Host "  4. Dann dieses Skript nochmal ausführen ODER diesen Befehl ausfuehren:" -ForegroundColor Yellow
Write-Host "     git push -u origin main" -ForegroundColor White
Write-Host ""

$answer = Read-Host "Hast du das GitHub-Repo bereits geloescht und neu angelegt? (j/n)"
if ($answer -eq "j" -or $answer -eq "J") {
    git push -u origin main
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  Fertig! Dein Code ist auf GitHub." -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "OK. Wenn du bereit bist, fuehre diesen Befehl im Projektordner aus:" -ForegroundColor Cyan
    Write-Host "  cd '$projectRoot'" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""
Read-Host "Druecke Enter zum Beenden"
