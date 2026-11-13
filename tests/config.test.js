// Kiểm thử cấu hình (checklist bảo mật mục 1 và 5): thiếu biến thì dừng, chỉ in tên biến, không in giá trị.
// Mỗi ca chạy trong một tiến trình riêng, thư mục làm việc rỗng (để dotenv không đọc .env thật của máy).
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG = path.join(__dirname, '..', 'src', 'config.js');
const AUTH = { AUTH_USERNAME: 'nv', AUTH_PASSWORD: 'mat-khau-bi-mat-123', AUTH_SECRET: 'x'.repeat(40) };

function chay(envVars) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'));
  const env = { PATH: process.env.PATH, ...(process.env.NODE_PATH && { NODE_PATH: process.env.NODE_PATH }), ...envVars };
  const r = spawnSync(process.execPath, ['-e', `process.stdout.write(JSON.stringify(require(${JSON.stringify(CONFIG)})))`], { cwd, env, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

test('[Luồng đúng] bộ biến DB_* dựng đúng chuỗi kết nối, DB_HOST mặc định là localhost, mật khẩu có ký tự đặc biệt được mã hoá', () => {
  const r = chay({ ...AUTH, DB_NAME: 'smart_crm', DB_USER: 'crm', DB_PASSWORD: 'p@ss/w:rd' });
  assert.equal(r.code, 0, r.err);
  assert.equal(JSON.parse(r.out).databaseUrl, 'postgres://crm:p%40ss%2Fw%3Ard@localhost:5432/smart_crm');
});

test('[Luồng đúng] trong Docker, DB_HOST=db trỏ tới dịch vụ db', () => {
  const r = chay({ ...AUTH, DB_NAME: 'smart_crm', DB_USER: 'crm', DB_PASSWORD: 'abc', DB_HOST: 'db' });
  assert.equal(JSON.parse(r.out).databaseUrl, 'postgres://crm:abc@db:5432/smart_crm');
});

test('[Giá trị biên] DATABASE_URL (cách cũ) được ưu tiên hơn bộ DB_*', () => {
  const r = chay({ ...AUTH, DATABASE_URL: 'postgres://u:p@h:1/d', DB_NAME: 'khac', DB_USER: 'khac', DB_PASSWORD: 'khac' });
  assert.equal(JSON.parse(r.out).databaseUrl, 'postgres://u:p@h:1/d');
});

test('[Dữ liệu sai] thiếu biến thì dừng với mã 1, báo TÊN các biến thiếu và KHÔNG in giá trị của biến nào', () => {
  const r = chay({ AUTH_USERNAME: 'nv', AUTH_PASSWORD: 'mat-khau-bi-mat-123', DB_NAME: 'smart_crm' });
  assert.equal(r.code, 1);
  assert.match(r.err, /AUTH_SECRET/);
  assert.match(r.err, /DB_USER/);
  assert.match(r.err, /DB_PASSWORD/);
  assert.doesNotMatch(r.err + r.out, /mat-khau-bi-mat-123/); // giá trị bí mật không lọt ra
});
