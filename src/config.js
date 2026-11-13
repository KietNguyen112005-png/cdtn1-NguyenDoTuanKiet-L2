require('dotenv').config();

const env = process.env;

// Biến bắt buộc. CSDL: hoặc DATABASE_URL (cách cũ), hoặc bộ DB_NAME + DB_USER + DB_PASSWORD (DB_HOST, DB_PORT có mặc định).
const thieu = ['AUTH_USERNAME', 'AUTH_PASSWORD', 'AUTH_SECRET'].filter((k) => !env[k]);
if (!env.DATABASE_URL) thieu.push(...['DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter((k) => !env[k]));
if (thieu.length) {
  // Chỉ in TÊN biến, không bao giờ in giá trị; dừng sớm thay vì chạy tiếp rồi lỗi khó hiểu.
  console.error(`Thiếu biến môi trường: ${thieu.join(', ')}. Xem .env.example.`);
  process.exit(1);
}

const databaseUrl = env.DATABASE_URL
  || `postgres://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD)}`
    + `@${env.DB_HOST || 'localhost'}:${env.DB_PORT || 5432}/${encodeURIComponent(env.DB_NAME)}`;

module.exports = {
  auth: { username: env.AUTH_USERNAME, password: env.AUTH_PASSWORD, secret: env.AUTH_SECRET },
  databaseUrl,
  port: Number(env.PORT) || 3000,
  tzOffsetMinutes: Number(env.SLA_TZ_OFFSET_MINUTES ?? 420), // Việt Nam UTC+7
};
