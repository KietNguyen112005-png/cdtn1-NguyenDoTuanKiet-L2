// Chạy mọi file migrations/*.sql chưa áp dụng, theo thứ tự tên. Chạy lại nhiều lần vẫn an toàn.
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function main() {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const done = await db.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
    if (done.rowCount) { console.log(`bỏ qua  ${file} (đã áp dụng)`); continue; }
    await db.withTransaction(async (client) => {
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    });
    console.log(`đã chạy ${file}`);
  }
}

main()
  .catch((err) => { console.error('Migration thất bại:', err.message); process.exitCode = 1; })
  .finally(() => db.pool.end());
