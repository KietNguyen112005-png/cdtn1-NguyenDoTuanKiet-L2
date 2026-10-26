// Nạp seeds/*.sql. Mọi file seed dùng ON CONFLICT DO NOTHING nên chạy lại không nhân đôi dữ liệu.
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

// Lỗi kết nối của Node có thể có message rỗng (lỗi gộp), nên lấy lý do từ nhiều chỗ và gợi ý cách sửa.
function explain(err) {
  const inner = (err.errors || []).find((e) => e.code) || err;
  const reason = err.message || inner.message || inner.code || String(err);
  if ([err.code, inner.code].includes('ECONNREFUSED')) {
    return `${reason}\nKhông kết nối được PostgreSQL ở DATABASE_URL. Hãy bật PostgreSQL (hoặc chạy "docker compose up -d") rồi thử lại.`;
  }
  return reason;
}

async function main() {
  const dir = path.join(__dirname, '..', 'seeds');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`đã nạp ${file}`);
  }
}

main()
  .catch((err) => { console.error('Seed thất bại:', explain(err)); process.exitCode = 1; })
  .finally(() => db.pool.end());
