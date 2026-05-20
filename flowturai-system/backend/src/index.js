const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const cron    = require('node-cron');
const path    = require('path');

const { monthlyBilling, autoDunning } = require('./cron/billing');
const { dailyBackup }                 = require('./cron/backup');
const { checkInbox }                  = require('./cron/inbox');

const app  = express();
const PORT = process.env.PORT || 3000;
const ENV  = process.env.ENVIRONMENT || 'production';

// Sicherheits-Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'"],
      imgSrc:        ["'self'", "data:"],
      connectSrc:    ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:1420'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Request-Logging
app.use((req, _res, next) => {
  if (process.env.LOG_REQUESTS === 'true') {
    console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path);
  }
  next();
});

// Admin-Authentifizierung
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }
  next();
};

// Oeffentliche Routen
const consultationRouter = require('./routes/consultation');
app.use('/api', consultationRouter);

// Geschuetzte Admin-Routen
const stageRouter      = require('./routes/stage');
const invoiceRouter    = require('./routes/invoice');
const analyticsRouter  = require('./routes/analytics');
const offersRouter     = require('./routes/offers');
const expensesRouter   = require('./routes/expenses');
const dunningRouter    = require('./routes/dunning');
const accountingRouter  = require('./routes/accounting');
const contractsRouter   = require('./routes/contracts');
const inboxRouter        = require('./routes/inbox');
const appointmentsRouter = require('./routes/appointments');

app.use('/api', adminAuth, stageRouter);
app.use('/api', adminAuth, invoiceRouter);
app.use('/api', adminAuth, analyticsRouter);
app.use('/api', adminAuth, offersRouter);
app.use('/api', adminAuth, expensesRouter);
app.use('/api', adminAuth, dunningRouter);
app.use('/api', adminAuth, accountingRouter);
app.use('/api', adminAuth, contractsRouter);
app.use('/api', adminAuth, inboxRouter);
app.use('/api', adminAuth, appointmentsRouter);

// Health-Check (oeffentlich)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Environment-Info
app.get('/api/env', adminAuth, (_req, res) => {
  res.json({ environment: ENV, version: process.env.npm_package_version || '2.0.0' });
});

// Static Files (Admin-Dashboard)
app.use(express.static(path.join(__dirname, '../admin')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../admin', 'index.html'));
});

// Cron-Jobs
// Monatliche Abrechnung: 1. des Monats, 08:00 Uhr (Berlin)
cron.schedule('0 8 1 * *', () => {
  console.log('[Cron] Starte monatliche Abrechnung...');
  monthlyBilling().catch(err => console.error('[Cron/Billing]', err));
}, { timezone: 'Europe/Berlin' });

// Automatisches Mahnwesen: taeglich 09:00 Uhr (Berlin)
cron.schedule('0 9 * * *', () => {
  console.log('[Cron] Starte automatisches Mahnwesen...');
  autoDunning().catch(err => console.error('[Cron/Dunning]', err));
}, { timezone: 'Europe/Berlin' });

// Taegliches Backup: 03:00 Uhr (Berlin)
cron.schedule('0 3 * * *', () => {
  console.log('[Cron] Starte taegliches Backup...');
  dailyBackup().catch(err => console.error('[Cron/Backup]', err));
}, { timezone: 'Europe/Berlin' });

// IMAP Posteingang: alle 15 Minuten
cron.schedule('*/15 * * * *', () => {
  console.log('[Cron] Prüfe IMAP-Posteingang...');
  checkInbox().catch(err => console.error('[Cron/Inbox]', err));
}, { timezone: 'Europe/Berlin' });

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log(' Flowturai API  [' + ENV.toUpperCase() + ']');
  console.log(' Port: ' + PORT + '  |  ' + new Date().toLocaleString('de-DE'));
  console.log('========================================\n');
});
