// Nạp seeds/*.sql. Mọi file seed dùng ON CONFLICT DO NOTHING nên chạy lại không nhân đôi dữ liệu.
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function main() {
  const dir = path.join(__dirname, '..', 'seeds');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`đã nạp ${file}`);
  }
}

main()
  .catch((err) => { console.error('Seed thất bại:', err.message); process.exitCode = 1; })
  .finally(() => db.pool.end());
