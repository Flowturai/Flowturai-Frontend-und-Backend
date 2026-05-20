const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');
const { sendEmail } = require('../lib/email');

/**
 * Tägliches Datenbank-Backup
 * Läuft jeden Tag um 03:00 Uhr (node-cron in index.js)
 * Speichert komprimierte SQL-Dumps im /backups Ordner (Docker Volume)
 * Behält die letzten 30 Tage, ältere werden automatisch gelöscht
 */
async function dailyBackup() {
  const now      = new Date();
  const stamp    = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const env      = process.env.ENVIRONMENT || 'production';
  const filename = `backup_${env}_${stamp}.sql.gz`;
  const backupDir = process.env.BACKUP_DIR || '/backups';
  const filePath  = path.join(backupDir, filename);

  console.log(`[Backup] Starte Backup → ${filename}`);

  try {
    // Verzeichnis sicherstellen
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // pg_dump + gzip
    const dbUrl = process.env.DATABASE_URL;
    execSync(`pg_dump "${dbUrl}" | gzip > "${filePath}"`, {
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 120000,
    });

    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`[Backup] ✓ ${filename} (${sizeMB} MB)`);

    // Alte Backups löschen (> 30 Tage)
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const files  = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql.gz'));
    let deleted  = 0;
    for (const f of files) {
      const fp   = path.join(backupDir, f);
      const mtime = fs.statSync(fp).mtimeMs;
      if (mtime < cutoff) { fs.unlinkSync(fp); deleted++; }
    }

    if (deleted > 0) console.log(`[Backup] ${deleted} alte Backups gelöscht`);

    // Nur bei Fehler eine Mail senden – kein tägliches Rauschen im Postfach
    // (Stille = alles gut)

  } catch (err) {
    console.error('[Backup] FEHLER:', err.message);

    // Bei Fehler: sofortige Admin-Benachrichtigung
    try {
      await sendEmail({
        to:      process.env.ADMIN_EMAIL,
        subject: `⚠️ Backup fehlgeschlagen – ${now.toLocaleDateString('de-DE')}`,
        body: [
          `Das tägliche Datenbank-Backup ist fehlgeschlagen!`,
          ``,
          `Fehler: ${err.message}`,
          `Zeitpunkt: ${now.toLocaleString('de-DE')}`,
          `Umgebung: ${env}`,
          ``,
          `Bitte den Server prüfen.`,
        ].join('\n'),
      });
    } catch (mailErr) {
      console.error('[Backup] Kann Fehler-Mail nicht senden:', mailErr.message);
    }
  }
}

module.exports = { dailyBackup };
