const fs = require('fs');
const path = require('path');

const {assertDatabaseConfig} = require('../src/config');
const {query, closePool} = require('../src/db');

const run = async () => {
  assertDatabaseConfig();
  const sqlPath = path.resolve(__dirname, '../sql/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 当前种子与迁移放在同一文件，重复执行是幂等的。
  await query(sql);
  console.log('[seed] default seed ensured');
};

run()
  .catch(error => {
    console.error('[seed] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
