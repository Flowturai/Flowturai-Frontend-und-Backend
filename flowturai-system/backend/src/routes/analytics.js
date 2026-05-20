const router = require('express').Router();
const { query } = require('../lib/db');

/**
 * Vollständige Controlling-Daten für das Admin-Dashboard
 * Alle Abfragen in einer einzigen Route für Performance
 */
router.get('/analytics', async (req, res) => {
  try {
    const [
      stageCount,
      monthlyRevenue,
      mrrData,
      invoiceStats,
      conversionTimes,
      topMonths,
    ] = await Promise.all([

      // 1. Kontakte pro Stufe (Funnel)
      query(`
        SELECT status, COUNT(*) AS count
        FROM contacts
        GROUP BY status
        ORDER BY CASE status
          WHEN 'lead' THEN 1 WHEN 'stufe1' THEN 2 WHEN 'stufe2' THEN 3
          WHEN 'stufe3' THEN 4 WHEN 'stufe4' THEN 5 WHEN 'abgeschlossen' THEN 6
          ELSE 7 END
      `),

      // 2. Umsatz pro Monat (letzte 12 Monate)
      query(`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM') AS monat,
          SUM(amount)::NUMERIC(10,2)     AS umsatz,
          COUNT(*)                       AS anzahl
        FROM invoices
        WHERE status IN ('paid', 'sent')
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY monat
        ORDER BY monat ASC
      `),

      // 3. MRR (Monthly Recurring Revenue) aus aktiven Abos
      query(`
        SELECT
          COALESCE(SUM(price), 0)::NUMERIC(10,2) AS mrr,
          COUNT(*)                               AS abo_count
        FROM subscriptions
        WHERE status = 'active'
      `),

      // 4. Rechnungsstatistiken
      query(`
        SELECT
          status,
          COUNT(*)                       AS anzahl,
          SUM(amount)::NUMERIC(10,2)     AS summe
        FROM invoices
        GROUP BY status
      `),

      // 5. Durchschnittliche Zeit zwischen Stufen (Konvertierungszeit)
      query(`
        SELECT
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::NUMERIC(5,1) AS tage_bis_konvertierung,
          COUNT(*) AS total
        FROM contacts
        WHERE status NOT IN ('lead', 'verloren')
          AND updated_at IS NOT NULL
      `),

      // 6. Umsatz-Top-Monate (alle Zeit)
      query(`
        SELECT
          TO_CHAR(created_at, 'Mon YYYY') AS monat,
          SUM(amount)::NUMERIC(10,2)      AS umsatz
        FROM invoices
        WHERE status = 'paid'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) DESC
        LIMIT 6
      `),
    ]);

    // Überfällige Rechnungen
    await query(
      `UPDATE invoices SET status = 'overdue'
       WHERE status = 'sent' AND due_date < CURRENT_DATE`
    );

    // Zusammenfassung berechnen
    const stages     = Object.fromEntries(stageCount.rows.map(r => [r.status, parseInt(r.count)]));
    const mrr        = parseFloat(mrrData.rows[0]?.mrr || 0);
    const aboCount   = parseInt(mrrData.rows[0]?.abo_count || 0);

    const invByStatus = Object.fromEntries(invoiceStats.rows.map(r => [r.status, { anzahl: parseInt(r.anzahl), summe: parseFloat(r.summe || 0) }]));
    const offenSumme  = (invByStatus.sent?.summe || 0) + (invByStatus.pending?.summe || 0);
    const bezahltSumme = invByStatus.paid?.summe || 0;

    const avgConversion = parseFloat(conversionTimes.rows[0]?.tage_bis_konvertierung || 0);

    // Jahresumsatz
    const jahresUmsatz = monthlyRevenue.rows.reduce((sum, r) => sum + parseFloat(r.umsatz), 0);

    res.json({
      funnel: {
        lead:          stages.lead          || 0,
        stufe1:        stages.stufe1        || 0,
        stufe2:        stages.stufe2        || 0,
        stufe3:        stages.stufe3        || 0,
        stufe4:        stages.stufe4        || 0,
        abgeschlossen: stages.abgeschlossen || 0,
        verloren:      stages.verloren      || 0,
      },
      umsatz: {
        mrr,
        arr: mrr * 12,
        aboCount,
        jahresUmsatz: parseFloat(jahresUmsatz.toFixed(2)),
        offen:   parseFloat(offenSumme.toFixed(2)),
        bezahlt: parseFloat(bezahltSumme.toFixed(2)),
        monatsVerlauf: monthlyRevenue.rows.map(r => ({
          monat:   r.monat,
          umsatz:  parseFloat(r.umsatz),
          anzahl:  parseInt(r.anzahl),
        })),
        topMonate: topMonths.rows,
      },
      performance: {
        avgKonvertierungTage: avgConversion,
        gesamtKontakte: Object.values(stages).reduce((a, b) => a + b, 0),
        konversionsRate: stages.lead
          ? Math.round(((stages.stufe2 || 0) / ((stages.lead || 1) + (stages.stufe1 || 0))) * 100)
          : 0,
      },
      invoices: invByStatus,
      environment: process.env.ENVIRONMENT || 'production',
    });
  } catch (err) {
    console.error('[analytics]', err);
    res.status(500).json({ error: 'Fehler beim Laden der Analytics' });
  }
});

module.exports = router;
