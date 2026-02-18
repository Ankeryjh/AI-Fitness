const fs = require('fs');
const path = require('path');

const {assertDatabaseConfig} = require('../src/config');
const {query, closePool} = require('../src/db');

const run = async () => {
  assertDatabaseConfig();

  const sqlPath = path.resolve(__dirname, '../sql/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await query(sql);
  console.log('[migrate] migration applied:', sqlPath);
};

run()
  .catch(error => {
    console.error('[migrate] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
