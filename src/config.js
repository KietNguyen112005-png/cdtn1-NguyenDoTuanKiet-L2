require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu biến môi trường DATABASE_URL. Hãy sao chép .env.example thành .env.');
}

for (const k of ['AUTH_USERNAME', 'AUTH_PASSWORD', 'AUTH_SECRET']) {
  if (!process.env[k]) throw new Error(`Thiếu biến môi trường ${k}. Xem .env.example.`);
}

module.exports = {
  auth: { username: process.env.AUTH_USERNAME, password: process.env.AUTH_PASSWORD, secret: process.env.AUTH_SECRET },
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 3000,
  tzOffsetMinutes: Number(process.env.SLA_TZ_OFFSET_MINUTES ?? 420), // Việt Nam UTC+7
};
