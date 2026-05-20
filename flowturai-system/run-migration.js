const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host:     '172.18.0.1',
  port:     5433,
  user:     'postgres',
  password: '20Kilian22!!',
  database: 'postgres',
});

const sql = fs.readFileSync('/app/migration.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('Migration OK');
    pool.end();
    process.exit(0);
  })
  .catch(e => {
    console.error('Migration FEHLER:', e.message);
    pool.end();
    process.exit(1);
  });
