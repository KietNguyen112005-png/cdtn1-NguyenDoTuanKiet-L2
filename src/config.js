require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu biến môi trường DATABASE_URL. Hãy sao chép .env.example thành .env.');
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 3000,
  tzOffsetMinutes: Number(process.env.SLA_TZ_OFFSET_MINUTES ?? 420), // Việt Nam UTC+7
};
